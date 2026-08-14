import * as z from "zod"

import { env } from "@/env"
import { getProxmoxClient } from "@/lib/proxmox"
import { publicProcedure } from "@/server/api"
import { insertInstanceSchema, selectInstanceSchema } from "@/server/db/schema"

const mockInstances: z.infer<typeof selectInstanceSchema>[] = [
  {
    cpu: 2,
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
    status: "running",
    templateId: 9001,
    updatedAt: new Date(),
  },
  {
    cpu: 2,
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
    status: "queued",
    templateId: 9002,
    updatedAt: new Date(),
  },
  {
    cpu: 4,
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
    status: "provisioning",
    templateId: 9003,
    updatedAt: new Date(),
  },
  {
    cpu: 2,
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
    status: "failed",
    templateId: 9004,
    updatedAt: new Date(),
  },
  {
    cpu: 2,
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
    status: "deleted",
    templateId: 9005,
    updatedAt: new Date(),
  },
]

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const PROXMOX_DEFAULT_POOL = env.PROXMOX_POOL

export const instanceRouter = {
  create: publicProcedure
    .route({
      method: "POST",
      path: "/instance/create",
      summary: "Create a new instance",
      tags: ["Instances"],
    })
    .input(
      z.object(
        insertInstanceSchema.omit({
          createdAt: true,
          deletedAt: true,
          networkId: true,
          pveNode: true,
          pveVmid: true,
          status: true,
          updatedAt: true,
        }).shape,
      ),
    )
    .output(z.object({ vmid: z.string() }))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(async ({ context, errors, input }) => {
      if (!input) throw errors.BAD_REQUEST()

      const proxmox = getProxmoxClient()

      const newVmid = 8001

      await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(input.templateId)
        .clone.$post({
          full: true,
          name: input.hostname,
          newid: newVmid,
          pool: PROXMOX_DEFAULT_POOL,
        })

      setTimeout(() => void 0, 5000)

      const newInstance = await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(newVmid)
        .status.current.$get()

      if (!newInstance) throw errors.NOT_FOUND()

      return {
        vmid: newInstance.vmid.toString(),
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
    .handler(async ({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const proxmox = getProxmoxClient()

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
    .handler(({ context, errors, input }) => {
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
    .output(z.array(selectInstanceSchema))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "No instances found for the organization",
      },
    })
    .handler(({ context, errors, input }) => {
      if (!input.organizationId) throw errors.BAD_REQUEST()

      const instance = mockInstances.filter(
        (instance) => instance.organizationId === input.organizationId,
      )

      if (!instance || instance.length === 0) throw errors.NOT_FOUND()

      return instance
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
    .handler(async ({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const proxmox = getProxmoxClient()

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
    .handler(async ({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const proxmox = getProxmoxClient()

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
    .handler(async ({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const proxmox = getProxmoxClient()

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
    .handler(async ({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const proxmox = getProxmoxClient()

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
    .handler(async ({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const proxmox = getProxmoxClient()

      const vmid = Number(input.id)

      await proxmox.nodes.$(PROXMOX_DEFAULT_NODE).qemu.$(vmid).config.$put({
        name: input.hostname,
      })

      return { id: input.id }
    }),
}
