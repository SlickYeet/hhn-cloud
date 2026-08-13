import * as z from "zod"

import { publicProcedure } from "@/server/api"
import { insertInstanceSchema, selectInstanceSchema } from "@/server/db/schema"

const mockInstances: z.infer<typeof selectInstanceSchema>[] = [
  {
    createdAt: new Date(),
    id: "1",
    ipAddress: "192.168.1.1",
    macAddress: "00:1A:2B:3C:4D:5E",
    name: "Instance 1",
    organizationId: "org1",
    pveNode: "node1",
    pveVmid: 101,
    status: "running",
    templateId: "template1",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "2",
    ipAddress: "192.168.1.2",
    macAddress: "00:1A:2B:3C:4D:5F",
    name: "Instance 2",
    organizationId: "org2",
    pveNode: "node2",
    pveVmid: 102,
    status: "queued",
    templateId: "template2",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "3",
    ipAddress: "192.168.1.3",
    macAddress: "00:1A:2B:3C:4D:60",
    name: "Instance 3",
    organizationId: "org3",
    pveNode: "node3",
    pveVmid: 103,
    status: "provisioning",
    templateId: "template3",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "4",
    ipAddress: "192.168.1.4",
    macAddress: "00:1A:2B:3C:4D:61",
    name: "Instance 4",
    organizationId: "org4",
    pveNode: "node4",
    pveVmid: 104,
    status: "failed",
    templateId: "template4",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "5",
    ipAddress: "192.168.1.5",
    macAddress: "00:1A:2B:3C:4D:62",
    name: "Instance 5",
    organizationId: "org4",
    pveNode: "node5",
    pveVmid: 105,
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

  getById: publicProcedure
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
