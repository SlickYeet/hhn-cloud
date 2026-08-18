import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { instanceSshKeyTable } from "@/server/db/schema"

export type InstanceSshKey = typeof instanceSshKeyTable.$inferInsert

const instanceSshKeySchemaConstraints = {
  createdAt: z.coerce.date().optional(),
}

export const insertInstanceSshKeySchema = createInsertSchema(
  instanceSshKeyTable,
  instanceSshKeySchemaConstraints,
)
export const selectInstanceSshKeySchema = createSelectSchema(
  instanceSshKeyTable,
  instanceSshKeySchemaConstraints,
)
