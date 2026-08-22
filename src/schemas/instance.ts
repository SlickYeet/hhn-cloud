import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { env } from "@/env"
import { selectInstanceSshKeySchema } from "@/schemas/instance-ssh-key"
import { selectIpAllocationSchema } from "@/schemas/ip-allocation"
import { instanceTable } from "@/server/db/schema"

export type Instance = typeof instanceTable.$inferInsert

const instanceSchemaConstraints = {
  cores: z.int().min(1).max(64),
  createdAt: z.coerce.date().optional(),
  disk: z.int().min(1).max(1024),
  memory: z
    .int()
    .min(512)
    .max(1024 * 64),
  pveVmid: z
    .int()
    .min(env.PROXMOX_CLOUD_VM_VMID_RANGE[0])
    .max(env.PROXMOX_CLOUD_VM_VMID_RANGE[1]),
  templateId: z
    .int()
    .min(env.PROXMOX_TEMPLATE_VMID_RANGE[0])
    .max(env.PROXMOX_TEMPLATE_VMID_RANGE[1]),
  updatedAt: z.coerce.date().optional(),
}

export const insertInstanceSchema = createInsertSchema(
  instanceTable,
  instanceSchemaConstraints,
)
export const selectInstanceSchema = createSelectSchema(
  instanceTable,
  instanceSchemaConstraints,
)
  .omit({ rootPassword: true })
  .extend({
    ipAllocations: z.array(selectIpAllocationSchema),
    sshKeys: z.array(selectInstanceSshKeySchema),
  })

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
