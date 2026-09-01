import { openapi } from "@orpc/openapi"
import { count, eq } from "drizzle-orm"
import * as z from "zod"

import { protectedProcedure } from "@/server/api/base"
import { member as organizationMemberTable } from "@/server/db/schema"
import { getApiKeyFromHeaders } from "@/server/queries/api-key"

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
      .input(
        z
          .object({
            organizationId: z.string().optional(),
          })
          .optional(),
      )
      .output(z.number())
      .handler(async ({ context, input }) => {
        const { apiKey } = await getApiKeyFromHeaders(context.headers, false)

        const organizationId =
          input?.organizationId ||
          context.session.session.activeOrganizationId ||
          apiKey?.referenceId
        if (!organizationId) return 0

        const [memberCount] = await context.db
          .select({ count: count() })
          .from(organizationMemberTable)
          .where(eq(organizationMemberTable.organizationId, organizationId))

        return memberCount.count
      }),
  },
}
