import { openapi } from "@orpc/openapi"
import * as z from "zod"

import { insertSshKeySchema, selectSshKeySchema } from "@/schemas/ssh-key"
import { protectedProcedure } from "@/server/api/base"
import { getApiKeyFromHeaders } from "@/server/queries/api-key"

export const sshKeyRouter = {
  create: protectedProcedure
    .meta(
      openapi({
        method: "POST",
        path: "/sshkey/create",
        summary: "Create a new SSH key",
        tags: ["SSH Keys"],
      }),
    )
    .input(z.object(insertSshKeySchema.shape))
    .output(z.object(selectSshKeySchema.shape))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "SSH key not found",
      },
      NOT_IMPLEMENTED: {
        message: "Not implemented",
      },
    })
    .handler(({ errors, input }) => {
      if (!input) throw errors.BAD_REQUEST()
      throw errors.NOT_IMPLEMENTED()
    }),

  list: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/sshkeys",
        summary: "List all SSH keys",
        tags: ["SSH Keys"],
      }),
    )
    .output(z.array(selectSshKeySchema))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
    })
    .handler(async ({ context, errors }) => {
      const { apiKey } = await getApiKeyFromHeaders(context.headers, false)

      const organizationId =
        context.session.session.activeOrganizationId || apiKey?.referenceId
      if (!organizationId) {
        throw errors.BAD_REQUEST({
          message: "No active organization found for the user",
        })
      }

      const sshKeys = await context.db.query.sshKeyTable.findMany({
        where: (sshKey, { eq }) => eq(sshKey.organizationId, organizationId),
      })

      if (!sshKeys || sshKeys.length === 0) return []

      return sshKeys
    }),
}
