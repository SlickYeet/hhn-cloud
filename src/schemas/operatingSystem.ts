import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { env } from "@/env"
import {
  operatingSystemCategoryTable,
  operatingSystemReleaseTable,
  operatingSystemTable,
} from "@/server/db/schema"

export type OperatingSystem = typeof operatingSystemTable.$inferInsert

const operatingSystemSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  pveVmid: z
    .int()
    .min(env.NEXT_PUBLIC_PROXMOX_TEMPLATE_VMID_RANGE[0])
    .max(env.NEXT_PUBLIC_PROXMOX_TEMPLATE_VMID_RANGE[1]),
  updatedAt: z.coerce.date().optional(),
}

export const selectOperatingSystemCategorySchema = createSelectSchema(
  operatingSystemCategoryTable,
  {
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  },
)
export const selectOperatingSystemReleaseSchema = createSelectSchema(
  operatingSystemReleaseTable,
  {
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  },
).extend({
  category: selectOperatingSystemCategorySchema.optional(),
})

export const insertOperatingSystemSchema = createInsertSchema(
  operatingSystemTable,
  operatingSystemSchemaConstraints,
)
export const selectOperatingSystemSchema = createSelectSchema(
  operatingSystemTable,
  operatingSystemSchemaConstraints,
).extend({
  release: selectOperatingSystemReleaseSchema.optional(),
})
