import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { sshKeyTable, sshKeyTypeEnum } from "@/server/db/schema"

const sshKeyConstraints = {
  comment: z.string().max(255).nullish(),
  createdAt: z.coerce.date().optional(),
  name: z.string().min(3).max(255),
  updatedAt: z.coerce.date().optional(),
}

export const insertSSHKeySchema = createInsertSchema(
  sshKeyTable,
  sshKeyConstraints,
).extend({
  type: z.enum(sshKeyTypeEnum.enumValues).default("ed25519"),
})
export const selectSSHKeySchema = createSelectSchema(
  sshKeyTable,
  sshKeyConstraints,
)

export const generateSSHKeySchema = insertSSHKeySchema.pick({
  name: true,
})

export type SSHKey = z.infer<typeof selectSSHKeySchema>
