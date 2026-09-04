import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import * as z from "zod"

import { selectResourcePlanSchema } from "@/schemas/resource-plan"
import { createTRPCRouter, publicProcedure } from "@/server/api/init"

export const resourcePlanRouter = createTRPCRouter({
  list: publicProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/resource-plan/list",
          summary: "List all resource plans",
          tags: ["Resource Plans"],
        }),
      ),
    )
    .output(z.array(selectResourcePlanSchema))
    .query(async ({ ctx }) => {
      const resourcePlans = await ctx.db.query.resourcePlanTable.findMany()
      if (!resourcePlans || resourcePlans.length === 0) return []
      return resourcePlans
    }),
})
