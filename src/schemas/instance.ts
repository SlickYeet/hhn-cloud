import { insertInstanceSchema } from "@/server/db/schema"

export const createInstanceSchema = insertInstanceSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  networkId: true,
  pveNode: true,
  pveVmid: true,
  rootPassword: true,
  status: true,
  updatedAt: true,
})
