import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { ipAllocationTable } from "@/server/db/schema"

export type IpAllocation = typeof ipAllocationTable.$inferInsert

const ipAllocationSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}

export const insertIpAllocationSchema = createInsertSchema(
  ipAllocationTable,
  ipAllocationSchemaConstraints,
)
export const selectIpAllocationSchema = createSelectSchema(
  ipAllocationTable,
  ipAllocationSchemaConstraints,
)
