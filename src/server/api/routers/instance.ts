import { randomUUID } from "node:crypto"
import { and, eq, isNull } from "drizzle-orm"
import * as z from "zod"

import { env } from "@/env"
import {
  encryptPassword,
  generateMacAddress,
  generateRootPassword,
} from "@/lib/crypto"
import { getProxmoxClient } from "@/lib/proxmox"
import {
  createInstanceSchema,
  insertInstanceSchema,
  selectInstanceSchema,
} from "@/schemas/instance"
import { selectInstanceSshKeySchema } from "@/schemas/instance-ssh-key"
import { selectIpAllocationSchema } from "@/schemas/ip-allocation"
import { publicProcedure } from "@/server/api/base"
import {
  instanceSshKeyTable,
  instanceTable,
  ipAllocationTable,
  sshKeyTable,
  templateTable,
} from "@/server/db/schema"
import { isUniqueConstraintError } from "@/server/db/utils"
import { getNextVmid } from "@/server/queries/instance"
import { getCloudNetwork } from "@/server/queries/network"
import { createDhcpReservation } from "@/server/services/network"
import { addDeleteInstanceJob } from "@/server/workers/delete-instance-queue"
import { addProvisionJob } from "@/server/workers/provision-queue"

const mockInstances: z.infer<typeof selectInstanceSchema>[] = [
  {
    cores: 2,
    createdAt: new Date(),
    deletedAt: null,
    disk: 50,
    hostname: "Instance 1",
    id: "1",
    memory: 4096,
    networkId: "network1",
    organizationId: "org1",
    pveNode: "node1",
    pveVmid: 101,
    rootPassword: "password123",
    status: "running",
    templateId: 9001,
    updatedAt: new Date(),
  },
  {
    cores: 2,
    createdAt: new Date(),
    deletedAt: null,
    disk: 50,
    hostname: "Instance 2",
    id: "2",
    memory: 4096,
    networkId: "network2",
    organizationId: "org2",
    pveNode: "node2",
    pveVmid: 102,
    rootPassword: "password456",
    status: "queued",
    templateId: 9002,
    updatedAt: new Date(),
  },
  {
    cores: 4,
    createdAt: new Date(),
    deletedAt: null,
    disk: 100,
    hostname: "Instance 3",
    id: "3",
    memory: 8192,
    networkId: "network3",
    organizationId: "org3",
    pveNode: "node3",
    pveVmid: 103,
    rootPassword: "password789",
    status: "provisioning",
    templateId: 9003,
    updatedAt: new Date(),
  },
  {
    cores: 2,
    createdAt: new Date(),
    deletedAt: null,
    disk: 50,
    hostname: "Instance 4",
    id: "4",
    memory: 4096,
    networkId: "network4",
    organizationId: "org4",
    pveNode: "node4",
    pveVmid: 104,
    rootPassword: "password000",
    status: "failed",
    templateId: 9004,
    updatedAt: new Date(),
  },
  {
    cores: 2,
    createdAt: new Date(),
    deletedAt: new Date(),
    disk: 50,
    hostname: "Instance 5",
    id: "5",
    memory: 4096,
    networkId: "network5",
    organizationId: "org4",
    pveNode: "node5",
    pveVmid: 105,
    rootPassword: "password111",
    status: "deleted",
    templateId: 9005,
    updatedAt: new Date(),
  },
]

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const proxmox = getProxmoxClient()

export const instanceRouter = {
  create: publicProcedure
    .route({
      method: "POST",
      path: "/instance/create",
      successStatus: 202,
      summary: "Create a new instance",
      tags: ["Instances"],
    })
    .input(z.object(createInstanceSchema.shape))
    .output(
      z.object({
        instanceId: z.string(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      CONFLICT: {
        message: "An instance with that vmid already exists",
      },
      INTERNAL_SERVER_ERROR: {
        message: "An unexpected error occurred while processing the request",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ context, errors, input }) => {
      if (!input) throw errors.BAD_REQUEST()

      const network = await getCloudNetwork()
      if (!network) {
        throw errors.NOT_FOUND({
          message: "Network not found",
        })
      }

      const macAddress = generateMacAddress()
      const rootPassword = generateRootPassword()

      const [template] = await context.db
        .select()
        .from(templateTable)
        .where(eq(templateTable.pveVmid, input.templateId))

      if (!template) {
        throw errors.NOT_FOUND({
          message: `Template ${input.templateId} not found`,
        })
      }

      const [sshKey] = await context.db
        .select()
        .from(sshKeyTable)
        .where(eq(sshKeyTable.id, input.sshKeyId))

      if (!sshKey) {
        throw errors.NOT_FOUND({
          message: `SSH key ${input.sshKeyId} not found`,
        })
      }

      const instance = await context.db.transaction(async (tx) => {
        const nextVmid = await getNextVmid(proxmox, tx)

        const instanceRow = await tx
          .insert(instanceTable)
          .values({
            cores: template.cores,
            disk: template.disk,
            hostname: input.hostname,
            id: randomUUID(),
            memory: template.memory,
            networkId: network.id,
            organizationId: input.organizationId,
            pveNode: PROXMOX_DEFAULT_NODE,
            pveVmid: nextVmid,
            rootPassword: encryptPassword(rootPassword),
            status: "queued",
            templateId: input.templateId,
          })
          .returning()
          .catch((error) => {
            const constraintName = "instance_pve_vmid_unique"
            if (isUniqueConstraintError(error, constraintName)) return null
            throw error
          })

        if (!instanceRow) {
          throw errors.CONFLICT({
            message: `VMID ${nextVmid} already exists`,
          })
        }

        const [newInstance] = instanceRow
        if (!newInstance) throw errors.INTERNAL_SERVER_ERROR()

        const ipAllocations = await tx
          .insert(ipAllocationTable)
          .values({
            gateway: network.gateway,
            id: randomUUID(),
            instanceId: newInstance.id,
            ipAddress: network.ip.split("/")[0],
            macAddress,
            networkId: network.id,
          })
          .returning()
          .catch((error) => {
            if (
              isUniqueConstraintError(error, "ip_allocation_ip_address_unique")
            )
              return null
            throw error
          })

        if (!ipAllocations) {
          throw errors.CONFLICT({
            message: `IP ${network.ip.split("/")[0]} already allocated`,
          })
        }

        const [instanceSshKey] = await tx
          .insert(instanceSshKeyTable)
          .values({
            id: randomUUID(),
            instanceId: newInstance.id,
            sshKeyId: input.sshKeyId,
          })
          .returning()

        if (!instanceSshKey) {
          throw errors.INTERNAL_SERVER_ERROR({
            message: "Failed to associate SSH key with instance",
          })
        }

        await createDhcpReservation(
          network.ip.split("/")[0],
          macAddress,
          input.hostname,
        )

        return {
          id: newInstance.id,
        }
      })

      const { jobId } = await addProvisionJob({
        instanceId: instance.id,
        macAddress,
        network,
        rootPassword,
        sshKeyId: input.sshKeyId,
        template,
      })

      if (!jobId) {
        throw errors.INTERNAL_SERVER_ERROR({
          message: "Provision job could not be created",
        })
      }

      return {
        instanceId: instance.id,
        jobId,
        message: "Your instance is being created.",
      }
    }),

  delete: publicProcedure
    .route({
      method: "DELETE",
      path: "/instance/{id}/delete",
      summary: "Delete an instance",
      tags: ["Instances"],
    })
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        instanceId: z.string(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      INTERNAL_SERVER_ERROR: {
        message: "An unexpected error occurred while processing the request",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const existingInstance = await context.db.query.instanceTable.findFirst({
        where: (instance, { eq }) => eq(instance.id, input.id),
      })

      if (!existingInstance) {
        throw errors.NOT_FOUND({
          message: `Instance ${input.id} not found`,
        })
      }

      if (existingInstance.deletedAt) {
        throw errors.BAD_REQUEST({
          message: `Instance ${input.id} is already deleted`,
        })
      }

      const instance = await context.db.transaction(async (tx) => {
        const instanceRow = await tx
          .update(instanceTable)
          .set({
            deletedAt: new Date(),
            status: "pending_deletion",
          })
          .where(
            and(
              eq(instanceTable.id, input.id),
              isNull(instanceTable.deletedAt),
            ),
          )
          .returning()

        const [deletedInstance] = instanceRow
        if (!deletedInstance) {
          throw errors.NOT_FOUND({
            message: `Instance ${input.id} not found or already deleted`,
          })
        }

        return deletedInstance
      })

      const { jobId } = await addDeleteInstanceJob({
        instanceId: instance.id,
      })

      if (!jobId) {
        throw errors.INTERNAL_SERVER_ERROR({
          message: "Delete instance job could not be created",
        })
      }

      return {
        instanceId: instance.id,
        jobId,
        message: "Your instance is being deleted.",
      }
    }),

  get: publicProcedure
    .route({
      method: "GET",
      path: "/instance/{id}/get",
      summary: "Get an instance by ID",
      tags: ["Instances"],
    })
    .input(z.object({ id: z.string() }))
    .output(selectInstanceSchema)
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(({ errors, input }) => {
      // omit rootPassword from the output

      if (!input.id) throw errors.BAD_REQUEST()

      const instance = mockInstances.find(
        (instance) => instance.id === input.id,
      )

      if (!instance) throw errors.NOT_FOUND()

      return instance
    }),

  list: publicProcedure
    .route({
      method: "GET",
      path: "/instance/list",
      summary: "List an organization's instances",
      tags: ["Instances"],
    })
    .input(z.object({ organizationId: z.string() }))
    .output(
      z
        .array(
          selectInstanceSchema.omit({ rootPassword: true }).extend({
            ipAllocations: z.array(selectIpAllocationSchema),
            sshKeys: z.array(selectInstanceSshKeySchema),
          }),
        )
        .nullable(),
    )
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
    })
    .handler(async ({ context, errors, input }) => {
      if (!input.organizationId) throw errors.BAD_REQUEST()

      const instances = await context.db.query.instanceTable.findMany({
        columns: {
          rootPassword: false,
        },
        orderBy: (instances, { desc }) => desc(instances.createdAt),
        where: (instances, { eq }) =>
          eq(instances.organizationId, input.organizationId),
        with: {
          ipAllocations: true,
          sshKeys: true,
        },
      })

      if (!instances || instances.length === 0) return null

      return instances
    }),

  restart: publicProcedure
    .route({
      method: "POST",
      path: "/instance/{id}/restart",
      summary: "Restart an instance",
      tags: ["Instances"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      CONFLICT: {
        message: "Instance is already restarting",
      },
      FORBIDDEN: {
        message: "Instance is not running",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const vmid = Number(input.id)

      await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(vmid)
        .status.reboot.$post()

      return { id: input.id }
    }),

  shutdown: publicProcedure
    .route({
      method: "POST",
      path: "/instance/{id}/shutdown",
      summary: "Shutdown an instance",
      tags: ["Instances"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      FORBIDDEN: {
        message: "Instance is not running",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const vmid = Number(input.id)

      await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(vmid)
        .status.shutdown.$post()

      return { id: input.id }
    }),

  start: publicProcedure
    .route({
      method: "POST",
      path: "/instance/{id}/start",
      summary: "Start an instance",
      tags: ["Instances"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      CONFLICT: {
        message: "Instance is already running",
      },
      FORBIDDEN: {
        message: "Instance is already running",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const vmid = Number(input.id)

      await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(vmid)
        .status.start.$post()

      return { id: input.id }
    }),

  stop: publicProcedure
    .route({
      method: "POST",
      path: "/instance/{id}/stop",
      summary: "Stop an instance",
      tags: ["Instances"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      FORBIDDEN: {
        message: "Instance is not running",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const vmid = Number(input.id)

      await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(vmid)
        .status.stop.$post()

      return { id: input.id }
    }),

  update: publicProcedure
    .route({
      method: "PUT",
      path: "/instance/{id}",
      summary: "Update an instance",
      tags: ["Instances"],
    })
    .input(
      z.object(
        insertInstanceSchema.pick({
          hostname: true,
          id: true,
          organizationId: true,
        }).shape,
      ),
    )
    .output(z.object({ id: z.string() }))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const vmid = Number(input.id)

      await proxmox.nodes.$(PROXMOX_DEFAULT_NODE).qemu.$(vmid).config.$put({
        name: input.hostname,
      })

      return { id: input.id }
    }),
}
