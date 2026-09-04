import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import * as z from "zod"

import {
  selectOperatingSystemCategorySchema,
  selectOperatingSystemSchema,
} from "@/schemas/operatingSystem"
import { createTRPCRouter, publicProcedure } from "@/server/api/init"

export const operatingSystemRouter = createTRPCRouter({
  category: {
    list: publicProcedure
      .meta(
        toTRPCMeta(
          openapi({
            method: "GET",
            path: "/operating-system/category/list",
            summary: "List all operating system categories",
            tags: ["Operating Systems"],
          }),
        ),
      )
      .output(z.array(selectOperatingSystemCategorySchema))
      .query(async ({ ctx }) => {
        const categories =
          await ctx.db.query.operatingSystemCategoryTable.findMany({
            orderBy: (c, { asc }) => asc(c.name),
          })

        if (!categories || categories.length === 0) return []

        return categories
      }),
  },
  get: publicProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/operating-system/{id}",
          summary: "Get an operating system by ID",
          tags: ["Operating Systems"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(selectOperatingSystemSchema)
    .query(async ({ ctx, input }) => {
      const operatingSystem = await ctx.db.query.operatingSystemTable.findFirst(
        {
          where: (os, { eq }) => eq(os.id, input.id),
          with: {
            release: {
              with: {
                category: true,
              },
            },
          },
        },
      )

      if (!operatingSystem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Operating system with ID ${input.id} not found`,
        })
      }

      return operatingSystem
    }),

  list: publicProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/operating-system/list",
          summary: "List all operating systems",
          tags: ["Operating Systems"],
        }),
      ),
    )
    .output(z.array(selectOperatingSystemSchema))
    .query(async ({ ctx }) => {
      const operatingSystems = await ctx.db.query.operatingSystemTable.findMany(
        {
          with: {
            release: {
              with: {
                category: true,
              },
            },
          },
        },
      )

      if (!operatingSystems || operatingSystems.length === 0) return []

      return operatingSystems
    }),
})
