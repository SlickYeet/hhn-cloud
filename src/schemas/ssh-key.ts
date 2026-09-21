import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { sshKeyTable } from "@/server/db/schema"

const sshKeyConstraints = {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}

export const insertSSHKeySchema = createInsertSchema(
  sshKeyTable,
  sshKeyConstraints,
)
export const selectSSHKeySchema = createSelectSchema(
  sshKeyTable,
  sshKeyConstraints,
)

export const generateSSHKeySchema = insertSSHKeySchema.pick({
  name: true,
})

export type SSHKey = z.infer<typeof selectSSHKeySchema>
