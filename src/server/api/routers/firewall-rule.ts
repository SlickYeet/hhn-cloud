import { randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
import { count, inArray } from "drizzle-orm"
import * as z from "zod"

import {
  createInstanceFirewallRuleSchema,
  selectInstanceFirewallRuleSchema,
} from "@/schemas/firewall-rule"
import { protectedProcedure } from "@/server/api/base"
import { instanceFirewallRuleTable } from "@/server/db/schema"
import { getApiKeyFromHeaders } from "@/server/queries/api-key"
import { addFirewallSyncJob } from "@/server/queues/firewall-sync-queue"

export const firewallRuleRouter = {
  count: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/firewall-rule/count",
        summary: "Get the count of all firewall rules in an organization",
        tags: ["Firewall Rules"],
      }),
    )
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional(),
    )
    .output(z.number())
    .handler(async ({ context, input }) => {
      const { apiKey } = await getApiKeyFromHeaders(context.headers, false)

      const organizationId =
        input?.organizationId ||
        context.session.session.activeOrganizationId ||
        apiKey?.referenceId
      if (!organizationId) return 0

      const orgInstanceIds = await context.db.query.instanceTable.findMany({
        columns: { id: true },
        where: (t, { eq }) => eq(t.organizationId, organizationId),
      })

      if (orgInstanceIds.length === 0) return 0

      const [firewallRuleCount] = await context.db
        .select({ count: count() })
        .from(instanceFirewallRuleTable)
        .where(
          inArray(
            instanceFirewallRuleTable.instanceId,
            orgInstanceIds.map((instance) => instance.id),
          ),
        )

      return firewallRuleCount.count
    }),

  create: protectedProcedure
    .meta(
      openapi({
        method: "POST",
        path: "/firewall-rule",
        summary: "Create a new firewall rule",
        tags: ["Firewall Rules"],
      }),
    )
    .input(createInstanceFirewallRuleSchema)
    .output(selectInstanceFirewallRuleSchema)
    .errors({
      FORBIDDEN: {
        message:
          "You do not have permission to create a firewall rule for this instance",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ context, errors, input }) => {
      const instance = await context.db.query.instanceTable.findFirst({
        where: (t, { eq }) => eq(t.id, input.instanceId),
      })

      if (!instance) throw errors.NOT_FOUND()
      if (
        instance.organizationId !== context.session.session.activeOrganizationId
      ) {
        throw errors.FORBIDDEN()
      }

      const [rule] = await context.db
        .insert(instanceFirewallRuleTable)
        .values({
          id: randomUUID(),
          ...input,
        })
        .returning()

      await addFirewallSyncJob({ instanceId: input.instanceId })

      return rule
    }),

  //   delete: protectedProcedure
  //     .meta(
  //       openapi({
  //         method: "DELETE",
  //         path: "/firewall-rule/{id}",
  //         summary: "Delete a firewall rule by ID",
  //         tags: ["Firewall", "Rules"],
  //       }),
  //     )
  //     // .input()
  //     // .output()
  //     .handler(async () => {
  //       // DELETE /api2/json/cluster/firewall/ipset/user_ID/192.168.80.50
  //     }),
}
