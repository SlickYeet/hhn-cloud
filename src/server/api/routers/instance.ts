import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import * as z from "zod"

import { env } from "@/env"
import { generateMacAddress } from "@/helpers/generate-mac-address"
import { generateRootPassword } from "@/helpers/generate-root-password"
import { getCloudNetwork } from "@/helpers/get-cloud-network"
import { getNextVmid } from "@/helpers/get-next-vmid"
import { getProxmoxClient } from "@/lib/proxmox"
import {
  createInstanceSchema,
  insertInstanceSchema,
  selectInstanceSchema,
} from "@/schemas/instance"
import { selectInstanceSshKeySchema } from "@/schemas/instance-ssh-key"
import { selectIpAllocationSchema } from "@/schemas/ip-allocation"
import { publicProcedure } from "@/server/api"
import { instanceTable, templateTable } from "@/server/db/schema"
import { addProvisionJob } from "@/server/workers/provision-queue"
import { createDhcpReservation } from "@/utilities/create-dhcp-reservation"
import { isUniqueConstraintError } from "@/utilities/is-unique-constraint-error"

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
      // 1. [x] create instance in database
      // 2. [x] add job to provision queue
      // 3. [x] return instance id to client and redirect to instance
      // 4. [] poll for instance status until it is running

      if (!input) throw errors.BAD_REQUEST()

      const network = await getCloudNetwork()
      if (!network) {
        throw errors.NOT_FOUND({
          message: "Network not found",
        })
      }

      const macAddress = generateMacAddress()

      const [template] = await context.db
        .select()
        .from(templateTable)
        .where(eq(templateTable.pveVmid, input.templateId))

      if (!template) {
        throw errors.NOT_FOUND({
          message: `Template ${input.templateId} not found`,
        })
      }

      const [instance] = await context.db.transaction(async (tx) => {
        const nextVmid = await getNextVmid(proxmox, tx)

        const newInstance = await tx
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
            rootPassword: generateRootPassword(),
            status: "queued",
            templateId: input.templateId,
          })
          .returning()
          .catch((error) => {
            const constraintName = "cloud_instance_pve_vmid_unique"
            if (isUniqueConstraintError(error, constraintName)) return null
            throw error
          })

        if (!newInstance) throw errors.CONFLICT()

        await createDhcpReservation(
          network.ip.split("/")[0],
          macAddress,
          input.hostname,
        )

        return newInstance
      })

      if (!instance) throw errors.NOT_FOUND()

      const { id: jobId } = await addProvisionJob({
        instanceId: instance.id,
        macAddress,
        network,
      })

      if (!jobId) throw errors.INTERNAL_SERVER_ERROR()

      return {
        instanceId: instance.id,
        jobId,
        message: "Your instance is being created.",
      }
    }),

  delete: publicProcedure
    .route({
      method: "DELETE",
      path: "/instance/:id",
      summary: "Delete an instance",
      tags: ["Instances"],
    })
    .input(z.object({ id: z.string() }))
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

      await proxmox.nodes.$(PROXMOX_DEFAULT_NODE).qemu.$(vmid).$delete({
        "destroy-unreferenced-disks": true,
        purge: true,
      })

      return { id: input.id }
    }),

  get: publicProcedure
    .route({
      method: "GET",
      path: "/instance/:id",
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
      path: "/instances",
      summary: "List an organization's instances",
      tags: ["Instances"],
    })
    .input(z.object({ organizationId: z.string() }))
    .output(
      z.array(
        selectInstanceSchema.extend({
          ipAllocations: z.array(selectIpAllocationSchema),
          sshKeys: z.array(selectInstanceSshKeySchema),
        }),
      ),
    )
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "No instances found for the organization",
      },
    })
    .handler(async ({ context, errors, input }) => {
      if (!input.organizationId) throw errors.BAD_REQUEST()

      const instances = await context.db.query.instanceTable.findMany({
        orderBy: (instances, { desc }) => desc(instances.createdAt),
        where: (instances, { eq }) =>
          eq(instances.organizationId, input.organizationId),
        with: {
          ipAllocations: true,
          sshKeys: true,
        },
      })

      if (!instances || instances.length === 0) throw errors.NOT_FOUND()

      return instances
    }),

  restart: publicProcedure
    .route({
      method: "POST",
      path: "/instance/:id/restart",
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
      path: "/instance/:id/shutdown",
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
      path: "/instance/:id/start",
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
      path: "/instance/:id/stop",
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
      path: "/instance/:id",
      summary: "Update an instance",
      tags: ["Instances"],
    })
    .input(
      z.object(
        insertInstanceSchema
          .pick({
            hostname: true,
            id: true,
            organizationId: true,
          })
          .partial().shape,
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
