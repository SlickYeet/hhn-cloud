import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { sshKeyTable } from "@/server/db/schema"

const sshKeyConstraints = {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}

export const insertSshKeySchema = createInsertSchema(
  sshKeyTable,
  sshKeyConstraints,
)
export const selectSshKeySchema = createSelectSchema(
  sshKeyTable,
  sshKeyConstraints,
)

export const createSshKeySchema = insertSshKeySchema.pick({
  name: true,
})

export type SSHKey = z.infer<typeof selectSshKeySchema>
