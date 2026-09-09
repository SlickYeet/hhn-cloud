import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import * as z from "zod"

import { selectActivitySchema } from "@/schemas/activity"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { queryActivity } from "@/server/queries/activity"

export const activityRouter = createTRPCRouter({
  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/activity/list",
          summary: "List activity for the active organization",
          tags: ["Activity"],
        }),
      ),
    )
    .input(
      z.discriminatedUnion("scope", [
        z.object({
          limit: z.int().positive().max(100).optional(),
          scope: z.literal("organization"),
        }),
        z.object({
          instanceId: z.string().optional(),
          limit: z.int().positive().max(100).optional(),
          scope: z.literal("instance"),
        }),
      ]),
    )
    .output(z.array(selectActivitySchema))
    .query(async ({ ctx, input }) => {
      if (input.scope === "instance" && !input.instanceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "instanceId is required when scope is 'instance'",
        })
      }

      const referenceId =
        input.scope === "instance" ? input.instanceId : undefined
      const referenceType = input.scope === "instance" ? "instance" : undefined

      const activity = await queryActivity(ctx.db, {
        limit: input.limit,
        organizationId: ctx.organizationId,
        referenceId,
        referenceType,
      })

      return activity
    }),
})
