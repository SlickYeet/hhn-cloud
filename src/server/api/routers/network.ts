import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { count } from "drizzle-orm"
import * as z from "zod"

import { selectNetworkSchema } from "@/schemas/network"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { networkTable } from "@/server/db/schema"

export const networkRouter = createTRPCRouter({
  count: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/network/count",
          summary: "Count all networks",
          tags: ["Networks"],
        }),
      ),
    )
    .output(z.number())
    .query(async ({ ctx }) => {
      const [networkCount] = await ctx.db
        .select({ count: count() })
        .from(networkTable)

      return networkCount.count
    }),

  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/network/list",
          summary: "List all networks",
          tags: ["Networks"],
        }),
      ),
    )
    .output(z.array(selectNetworkSchema))
    .query(async ({ ctx }) => {
      return await ctx.db.query.networkTable.findMany()
    }),
})
