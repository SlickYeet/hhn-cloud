import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { env } from "@/env"
import { selectInstanceSshKeySchema } from "@/schemas/instance-ssh-key"
import { selectIpAllocationSchema } from "@/schemas/ip-allocation"
import type { instanceStatusEnum } from "@/server/db/schema"
import { instanceTable } from "@/server/db/schema"

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
    .min(env.NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE[0])
    .max(env.NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE[1]),
  updatedAt: z.coerce.date().optional(),
}

export const insertInstanceSchema = createInsertSchema(
  instanceTable,
  instanceSchemaConstraints,
)
export const selectInstanceSchema = createSelectSchema(
  instanceTable,
  instanceSchemaConstraints,
).extend({
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
    operatingSystemId: true,
    organizationId: true,
    pveNode: true,
    pveVmid: true,
    resourcePlanId: true,
    status: true,
    updatedAt: true,
  })
  .extend({
    // inject a custom operatingSystemId to allow both uuid and slug
    operatingSystemId: z.union([z.uuid(), z.string()]),
    // inject a custom resourcePlanId to allow both uuid and slug
    resourcePlanId: z.union([z.uuid(), z.string()]),
    sshKeyId: z.string(),
  })

export type Instance = z.infer<typeof selectInstanceSchema>
export type InstanceStatus = (typeof instanceStatusEnum.enumValues)[number]
