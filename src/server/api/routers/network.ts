import { openapi } from "@orpc/openapi"
import { count } from "drizzle-orm"
import * as z from "zod"

import { selectNetworkSchema } from "@/schemas/network"
import { protectedProcedure } from "@/server/api/base"
import { networkTable } from "@/server/db/schema"

export const networkRouter = {
  count: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/network/count",
        summary: "Count all networks",
        tags: ["Networks"],
      }),
    )
    .output(z.number())
    .handler(async ({ context }) => {
      const [networkCount] = await context.db
        .select({ count: count() })
        .from(networkTable)

      return networkCount.count
    }),

  list: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/network/list",
        summary: "List all networks",
        tags: ["Networks"],
      }),
    )
    .output(z.array(selectNetworkSchema))
    .handler(async ({ context }) => {
      return await context.db.query.networkTable.findMany()
    }),
}
