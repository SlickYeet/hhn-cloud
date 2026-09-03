import { openapi } from "@orpc/openapi"
import { count, eq } from "drizzle-orm"
import * as z from "zod"

import { protectedProcedure } from "@/server/api/base"
import { member as organizationMemberTable } from "@/server/db/schema"

export const organizationRouter = {
  member: {
    count: protectedProcedure
      .meta(
        openapi({
          method: "GET",
          path: "/organization/member/count",
          summary: "Count all members of the active organization of the user",
          tags: ["Organization Members"],
        }),
      )
      .output(z.number())
      .handler(async ({ context }) => {
        const [memberCount] = await context.db
          .select({ count: count() })
          .from(organizationMemberTable)
          .where(
            eq(organizationMemberTable.organizationId, context.organizationId),
          )

        return memberCount.count
      }),
  },
}
