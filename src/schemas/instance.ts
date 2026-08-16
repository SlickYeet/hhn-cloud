import * as z from "zod"

import { insertInstanceSchema } from "@/server/db/schema"

export const createInstanceSchema = insertInstanceSchema
  .omit({
    cores: true,
    createdAt: true,
    deletedAt: true,
    disk: true,
    id: true,
    memory: true,
    networkId: true,
    pveNode: true,
    pveVmid: true,
    rootPassword: true,
    status: true,
    updatedAt: true,
  })
  .extend({
    sshKeyId: z.string(),
  })
