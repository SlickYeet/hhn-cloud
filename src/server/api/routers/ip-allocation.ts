import { openapi } from "@orpc/openapi"
import { and, count, eq, inArray, isNull } from "drizzle-orm"
import * as z from "zod"

import { selectIpAllocationSchema } from "@/schemas/ip-allocation"
import { protectedProcedure } from "@/server/api/base"
import { instanceTable, ipAllocationTable } from "@/server/db/schema"
import { getApiKeyFromHeaders } from "@/server/queries/api-key"

export const ipAllocationRouter = {
  count: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/ip-allocations/count",
        summary: "Count all IP allocations",
        tags: ["IP Allocations"],
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

      // TODO: check if the instance belongs to the organization

      const orgInstanceIds = await context.db.query.instanceTable.findMany({
        columns: { id: true },
        where: and(
          eq(instanceTable.organizationId, organizationId),
          isNull(instanceTable.deletedAt),
        ),
      })

      if (orgInstanceIds.length === 0) return 0

      const [ipAllocationCount] = await context.db
        .select({ count: count() })
        .from(ipAllocationTable)
        .where(
          inArray(
            ipAllocationTable.instanceId,
            orgInstanceIds.map((instance) => instance.id),
          ),
        )

      return ipAllocationCount.count
    }),

  list: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/ip-allocations",
        summary: "List all IP allocations",
        tags: ["IP Allocations"],
      }),
    )
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional(),
    )
    .output(z.array(selectIpAllocationSchema))
    .handler(async ({ context, input }) => {
      const { apiKey } = await getApiKeyFromHeaders(context.headers, false)

      const organizationId =
        input?.organizationId ||
        context.session.session.activeOrganizationId ||
        apiKey?.referenceId
      if (!organizationId) return []

      // TODO: check if the instance belongs to the organization

      const orgInstanceIds = await context.db.query.instanceTable.findMany({
        columns: { id: true },
        where: and(
          eq(instanceTable.organizationId, organizationId),
          isNull(instanceTable.deletedAt),
        ),
      })

      if (orgInstanceIds.length === 0) return []

      const ipAllocations = await context.db.query.ipAllocationTable.findMany({
        where: inArray(
          ipAllocationTable.instanceId,
          orgInstanceIds.map((instance) => instance.id),
        ),
      })

      return ipAllocations
    }),
}
