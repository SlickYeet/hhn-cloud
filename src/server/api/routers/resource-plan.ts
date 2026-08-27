import { openapi } from "@orpc/openapi"
import * as z from "zod"

import { selectResourcePlanSchema } from "@/schemas/resource-plan"
import { protectedProcedure } from "@/server/api/base"

export const resourcePlanRouter = {
  list: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/resource-plan/list",
        summary: "List all resource plans",
        tags: ["Resource Plans"],
      }),
    )
    .output(z.array(selectResourcePlanSchema))
    .errors({
      NOT_FOUND: {
        message: "No resource plans found",
      },
    })
    .handler(async ({ context, errors }) => {
      const resourcePlans = await context.db.query.resourcePlanTable.findMany()
      if (!resourcePlans || resourcePlans.length === 0) throw errors.NOT_FOUND()
      return resourcePlans
    }),
}
