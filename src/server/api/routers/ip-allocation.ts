import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { and, count, eq, inArray, isNull } from "drizzle-orm"
import * as z from "zod"

import { selectIpAllocationSchema } from "@/schemas/ip-allocation"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { instanceTable, ipAllocationTable } from "@/server/db/schema"

export const ipAllocationRouter = createTRPCRouter({
  count: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/ip-allocations/count",
          summary: "Count all IP allocations",
          tags: ["IP Allocations"],
        }),
      ),
    )
    .output(z.number())
    .query(async ({ ctx }) => {
      const orgInstanceIds = await ctx.db.query.instanceTable.findMany({
        columns: { id: true },
        where: and(
          eq(instanceTable.organizationId, ctx.organizationId),
          isNull(instanceTable.deletedAt),
        ),
      })

      if (orgInstanceIds.length === 0) return 0

      const [ipAllocationCount] = await ctx.db
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
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/ip-allocations",
          summary: "List all IP allocations",
          tags: ["IP Allocations"],
        }),
      ),
    )
    .output(z.array(selectIpAllocationSchema))
    .query(async ({ ctx }) => {
      const orgInstanceIds = await ctx.db.query.instanceTable.findMany({
        columns: { id: true },
        where: and(
          eq(instanceTable.organizationId, ctx.organizationId),
          isNull(instanceTable.deletedAt),
        ),
      })

      if (orgInstanceIds.length === 0) return []

      const ipAllocations = await ctx.db.query.ipAllocationTable.findMany({
        where: inArray(
          ipAllocationTable.instanceId,
          orgInstanceIds.map((instance) => instance.id),
        ),
      })

      return ipAllocations
    }),
})
