import { randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
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
import { protectedProcedure } from "@/server/api/base"
import {
  instanceSshKeyTable,
  instanceTable,
  ipAllocationTable,
  sshKeyTable,
} from "@/server/db/schema"
import { isUniqueConstraintError } from "@/server/db/utils"
import { getApiKeyFromHeaders } from "@/server/queries/api-key"
import { getNextVmid } from "@/server/queries/instance"
import { getCloudNetwork } from "@/server/queries/network"
import { createDhcpReservation } from "@/server/services/network"
import { addDeleteInstanceJob } from "@/server/workers/delete-instance-queue"
import { addProvisionJob } from "@/server/workers/provision-queue"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const proxmox = getProxmoxClient()

export const instanceRouter = {
  create: protectedProcedure
    .meta(
      openapi({
        method: "POST",
        path: "/instance/create",
        successStatus: 202,
        summary: "Create a new instance",
        tags: ["Instances"],
      }),
    )
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
      const network = await getCloudNetwork()
      if (!network) {
        throw errors.NOT_FOUND({
          message: "Network not found",
        })
      }

      const macAddress = generateMacAddress()
      const rootPassword = generateRootPassword()

      const plan = await context.db.query.resourcePlanTable.findFirst({
        where: (plan, { or, eq }) =>
          or(
            eq(plan.id, input.resourcePlanId),
            eq(plan.slug, input.resourcePlanId),
          ),
      })

      if (!plan) {
        throw errors.NOT_FOUND({
          message: `Resource plan ${input.resourcePlanId} not found`,
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

      const { apiKey } = await getApiKeyFromHeaders(context.headers, false)

      const organizationId =
        context.session.session.activeOrganizationId || apiKey?.referenceId
      if (!organizationId) {
        throw errors.BAD_REQUEST({
          message: "No active organization found for the user",
        })
      }

      const instance = await context.db.transaction(async (tx) => {
        const nextVmid = await getNextVmid(proxmox, tx)

        const instanceRow = await tx
          .insert(instanceTable)
          .values({
            cores: plan.cores,
            disk: plan.disk,
            hostname: input.hostname,
            id: randomUUID(),
            memory: plan.memory,
            networkId: network.id,
            operatingSystemId: input.operatingSystemId,
            organizationId,
            pveNode: PROXMOX_DEFAULT_NODE,
            pveVmid: nextVmid,
            resourcePlanId: plan.id,
            rootPassword: encryptPassword(rootPassword),
            status: "queued",
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
        plan,
        rootPassword,
        sshKeyId: input.sshKeyId,
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

  delete: protectedProcedure
    .meta(
      openapi({
        method: "DELETE",
        path: "/instance/{id}/delete",
        summary: "Delete an instance",
        tags: ["Instances"],
      }),
    )
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

  get: protectedProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/instance/{id}/get",
        summary: "Get an instance by ID",
        tags: ["Instances"],
      }),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object(selectInstanceSchema.shape))
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

      const instance = await context.db.query.instanceTable.findFirst({
        columns: {
          rootPassword: false,
        },
        where: (instance, { eq }) => eq(instance.id, input.id),
        with: {
          ipAllocations: true,
          sshKeys: true,
        },
      })

      if (!instance) throw errors.NOT_FOUND()

      return instance
    }),

  list: protectedProcedure
    .meta(
      openapi({
        description:
          "List all instances for the active organization of the user. An organization ID can be provided to list instances for a specific organization.",
        method: "GET",
        path: "/instance/list",
        summary: "List an organization's instances",
        tags: ["Instances"],
      }),
    )
    .input(
      z
        .object({
          limit: z.coerce.number().optional(),
          organizationId: z.string().nullish(),
        })
        .optional(),
    )
    .output(z.array(selectInstanceSchema).nullable())
    .handler(async ({ context, input }) => {
      const { apiKey } = await getApiKeyFromHeaders(context.headers, false)

      const organizationId = input?.organizationId || apiKey?.referenceId
      if (!organizationId) return []

      const instances = await context.db.query.instanceTable.findMany({
        columns: {
          rootPassword: false,
        },
        orderBy: (instances, { desc }) => desc(instances.createdAt),
        where: (i, { and, eq }) =>
          and(eq(i.organizationId, organizationId), isNull(i.deletedAt)),
        with: {
          ipAllocations: true,
          sshKeys: true,
        },
      })

      if (!instances || instances.length === 0) return []

      return instances
    }),

  restart: protectedProcedure
    .meta(
      openapi({
        method: "POST",
        path: "/instance/{id}/restart",
        summary: "Restart an instance",
        tags: ["Instances"],
      }),
    )
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

  shutdown: protectedProcedure
    .meta(
      openapi({
        method: "POST",
        path: "/instance/{id}/shutdown",
        summary: "Shutdown an instance",
        tags: ["Instances"],
      }),
    )
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

  start: protectedProcedure
    .meta(
      openapi({
        method: "POST",
        path: "/instance/{id}/start",
        summary: "Start an instance",
        tags: ["Instances"],
      }),
    )
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

  stop: protectedProcedure
    .meta(
      openapi({
        method: "POST",
        path: "/instance/{id}/stop",
        summary: "Stop an instance",
        tags: ["Instances"],
      }),
    )
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

  update: protectedProcedure
    .meta(
      openapi({
        method: "PUT",
        path: "/instance/{id}",
        summary: "Update an instance",
        tags: ["Instances"],
      }),
    )
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
