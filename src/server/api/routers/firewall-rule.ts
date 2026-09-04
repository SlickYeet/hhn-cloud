import { randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import { count, inArray } from "drizzle-orm"
import * as z from "zod"

import {
  createInstanceFirewallRuleSchema,
  selectInstanceFirewallRuleSchema,
} from "@/schemas/firewall-rule"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { instanceFirewallRuleTable } from "@/server/db/schema"
import { addFirewallSyncJob } from "@/server/queues/firewall-sync-queue"

export const firewallRuleRouter = createTRPCRouter({
  count: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/firewall-rule/count",
          summary: "Get the count of all firewall rules in an organization",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .output(z.number())
    .query(async ({ ctx }) => {
      const orgInstanceIds = await ctx.db.query.instanceTable.findMany({
        columns: { id: true },
        where: (i, { eq }) => eq(i.organizationId, ctx.organizationId),
      })

      if (orgInstanceIds.length === 0) return 0

      const [firewallRuleCount] = await ctx.db
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
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/firewall-rule",
          summary: "Create a new firewall rule",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .input(createInstanceFirewallRuleSchema)
    .output(selectInstanceFirewallRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.db.query.instanceTable.findFirst({
        where: (i, { eq }) => eq(i.id, input.instanceId),
      })

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Instance not found",
        })
      }

      if (
        instance.organizationId !== ctx.session.session.activeOrganizationId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to create a firewall rule for this instance",
        })
      }

      const [rule] = await ctx.db
        .insert(instanceFirewallRuleTable)
        .values({
          id: randomUUID(),
          ...input,
        })
        .returning()

      await addFirewallSyncJob({ instanceId: input.instanceId })

      return rule
    }),

  // delete: protectedProcedure
  //   .meta(
  //     toTRPCMeta(
  //       openapi({
  //         method: "DELETE",
  //         path: "/firewall-rule/{id}",
  //         summary: "Delete a firewall rule by ID",
  //         tags: ["Firewall", "Rules"],
  //       }),
  //     ),
  //   )
  //   // .input()
  //   // .output()
  //   .mutation(async () => {
  //     // DELETE /api2/json/cluster/firewall/ipset/user_ID/192.168.80.50
  //   }),
})
