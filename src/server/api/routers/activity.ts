import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import { and, desc, eq, lt, or } from "drizzle-orm"
import * as z from "zod"

import { selectActivitySchema } from "@/schemas/activity"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { activityTable } from "@/server/db/schema"

const activityListInput = z.object({
  cursor: z
    .object({
      id: z.uuid(),
      timestamp: z.date(),
    })
    .nullish(),
  limit: z.int().positive().max(100),
  type: z.enum(selectActivitySchema.shape.type.options).optional(),
})

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
        activityListInput.extend({
          scope: z.literal("organization"),
        }),
        activityListInput.extend({
          instanceId: z.string().optional(),
          scope: z.literal("instance"),
        }),
      ]),
    )
    .output(
      z.object({
        items: z.array(selectActivitySchema),
        nextCursor: z
          .object({
            id: z.uuid(),
            timestamp: z.date(),
          })
          .nullish(),
      }),
    )
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

      const conditions = [eq(activityTable.organizationId, ctx.organizationId)]

      if (input.cursor) {
        const cursorCondition = or(
          lt(activityTable.timestamp, input.cursor.timestamp),
          and(
            eq(activityTable.id, input.cursor.id),
            eq(activityTable.timestamp, input.cursor.timestamp),
          ),
        )
        if (cursorCondition) conditions.push(cursorCondition)
      }
      if (referenceId)
        conditions.push(eq(activityTable.referenceId, referenceId))
      if (referenceType)
        conditions.push(eq(activityTable.referenceType, referenceType))
      if (input.type) conditions.push(eq(activityTable.type, input.type))

      const activity = await ctx.db
        .select()
        .from(activityTable)
        .where(and(...conditions))
        .orderBy(desc(activityTable.timestamp), desc(activityTable.id))
        .limit(input.limit + 1)

      const hasMore = activity.length > input.limit
      const items = hasMore ? activity.slice(0, -1) : activity
      const lastItem = items[items.length - 1]
      const nextCursor = hasMore
        ? { id: lastItem.id, timestamp: lastItem.timestamp }
        : null

      return {
        items,
        nextCursor,
      }
    }),
})
