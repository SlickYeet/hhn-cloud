import * as z from "zod"

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
    sshKeyId: "sshkey1",
    status: "running",
    templateId: "template1",
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
    sshKeyId: "sshkey2",
    status: "queued",
    templateId: "template2",
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
    sshKeyId: "sshkey3",
    status: "provisioning",
    templateId: "template3",
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
    sshKeyId: "sshkey4",
    status: "failed",
    templateId: "template4",
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
    sshKeyId: "sshkey5",
    status: "deleted",
    templateId: "template5",
    updatedAt: new Date(),
  },
]

export const instanceRouter = {
  create: publicProcedure
    .route({
      method: "POST",
      path: "/instance/create",
      summary: "Create a new instance",
      tags: ["Instances"],
    })
    .input(z.object(insertInstanceSchema.shape))
    .output(z.object({ id: z.string() }))
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "Instance not found",
      },
    })
    .handler(({ context, errors, input }) => {
      if (!input) throw errors.BAD_REQUEST()

      const newInstance = {
        ...input,
        createdAt: new Date(),
        deletedAt: null,
        updatedAt: new Date(),
      }

      mockInstances.push(newInstance)

      if (!newInstance.id) throw errors.NOT_FOUND()

      return { id: newInstance.id }
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
    .handler(({ context, errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const instanceIndex = mockInstances.findIndex(
        (instance) => instance.id === input.id,
      )

      if (instanceIndex === -1) throw errors.NOT_FOUND()

      mockInstances.splice(instanceIndex, 1)

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
}
