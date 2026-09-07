import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { count, eq } from "drizzle-orm"
import * as z from "zod"

import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { selectActivitySchema } from "@/schemas/activity"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { member as organizationMemberTable } from "@/server/db/schema"

export const organizationRouter = createTRPCRouter({
  getActivity: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/organization/activity",
          summary: "Get all activity of the active organization of the user",
          tags: ["Organization Activity"],
        }),
      ),
    )
    .input(
      z
        .object({
          limit: z.number().optional(),
        })
        .optional(),
    )
    .output(z.array(selectActivitySchema))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db.query.activityTable.findMany({
        limit: input?.limit ?? DEFAULT_PAGE_SIZE,
        orderBy: (ac, { desc }) => desc(ac.timestamp),
        where: (ac, { eq }) => eq(ac.organizationId, ctx.organizationId),
      })

      return activity
    }),

  member: {
    count: protectedProcedure
      .meta(
        toTRPCMeta(
          openapi({
            method: "GET",
            path: "/organization/member/count",
            summary: "Count all members of the active organization of the user",
            tags: ["Organization Members"],
          }),
        ),
      )
      .output(z.number())
      .query(async ({ ctx }) => {
        const [memberCount] = await ctx.db
          .select({ count: count() })
          .from(organizationMemberTable)
          .where(eq(organizationMemberTable.organizationId, ctx.organizationId))

        return memberCount.count
      }),
  },
})
