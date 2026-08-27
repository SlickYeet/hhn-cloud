import { openapi } from "@orpc/openapi"
import * as z from "zod"

import { selectOperatingSystemSchema } from "@/schemas/operatingSystem"
import { protectedProcedure } from "@/server/api/base"

export const operatingSystemRouter = {
  get: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/operating-system/{id}",
        summary: "Get an operating system by ID",
        tags: ["Operating Systems"],
      }),
    )
    .input(z.object({ id: z.string() }))
    .output(selectOperatingSystemSchema)
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "Operating system not found",
      },
    })
    .handler(async ({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const operatingSystem =
        await context.db.query.operatingSystemTable.findFirst({
          where: (os, { eq }) => eq(os.id, input.id),
          with: {
            release: {
              with: {
                category: true,
              },
            },
          },
        })

      if (!operatingSystem) throw errors.NOT_FOUND()

      return operatingSystem
    }),

  list: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/operating-system/list",
        summary: "List all operating systems",
        tags: ["Operating Systems"],
      }),
    )
    .output(z.array(selectOperatingSystemSchema))
    .handler(async ({ context }) => {
      const operatingSystems =
        await context.db.query.operatingSystemTable.findMany({
          with: {
            release: {
              with: {
                category: true,
              },
            },
          },
        })

      if (!operatingSystems || operatingSystems.length === 0) return []

      return operatingSystems
    }),
}
