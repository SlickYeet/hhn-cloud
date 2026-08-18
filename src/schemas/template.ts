import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { templateTable } from "@/server/db/schema"

export type Template = typeof templateTable.$inferInsert

const templateSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}

export const insertTemplateSchema = createInsertSchema(
  templateTable,
  templateSchemaConstraints,
)
export const selectTemplateSchema = createSelectSchema(
  templateTable,
  templateSchemaConstraints,
)
