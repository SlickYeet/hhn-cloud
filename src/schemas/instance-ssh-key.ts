import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { instanceSSHKeyTable } from "@/server/db/schema"

export type InstanceSSHKey = typeof instanceSSHKeyTable.$inferInsert

const instanceSSHKeySchemaConstraints = {
  createdAt: z.coerce.date().optional(),
}

export const insertInstanceSSHKeySchema = createInsertSchema(
  instanceSSHKeyTable,
  instanceSSHKeySchemaConstraints,
)
export const selectInstanceSSHKeySchema = createSelectSchema(
  instanceSSHKeyTable,
  instanceSSHKeySchemaConstraints,
)
