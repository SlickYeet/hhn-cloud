import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { count, eq } from "drizzle-orm"
import * as z from "zod"

import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { member as organizationMemberTable } from "@/server/db/schema"

export const organizationRouter = createTRPCRouter({
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
