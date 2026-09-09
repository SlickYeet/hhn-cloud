import { randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import type { inferProcedureBuilderResolverOptions } from "@trpc/server"
import { TRPCError } from "@trpc/server"
import { and, count, eq, inArray, isNull } from "drizzle-orm"
import * as z from "zod"

import { env } from "@/env"
import { generateMacAddress } from "@/lib/crypto"
import { getProxmoxClient } from "@/lib/proxmox"
import type {
  InstancePowerAction,
  InstanceStatusEnum,
} from "@/schemas/instance"
import {
  createInstanceSchema,
  insertInstanceSchema,
  selectInstanceSchema,
} from "@/schemas/instance"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import {
  instanceSshKeyTable,
  instanceTable,
  ipAllocationTable,
  sshKeyTable,
} from "@/server/db/schema"
import { isUniqueConstraintError } from "@/server/db/utils"
import { getNextVmid } from "@/server/queries/instance"
import { getCloudNetwork } from "@/server/queries/network"
import { addDeleteInstanceJob } from "@/server/queues/delete-instance-queue"
import { addPowerActionJob } from "@/server/queues/power-action-queue"
import { addProvisionJob } from "@/server/queues/provision-queue"
import { logActivity } from "@/server/services/activity"
import { createDhcpReservation } from "@/server/services/network"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const VALID_SOURCE_STATUS: Record<InstancePowerAction, InstanceStatusEnum[]> = {
  reboot: ["running"],
  shutdown: ["running"],
  start: ["stopped"],
  stop: ["running"],
}
const TRANSIENT_STATUS: Record<InstancePowerAction, InstanceStatusEnum> = {
  reboot: "restarting",
  shutdown: "stopping",
  start: "starting",
  stop: "stopping",
}

const proxmox = getProxmoxClient()

export const instanceRouter = createTRPCRouter({
  count: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/instance/count",
          summary:
            "Count all instances for the active organization of the user",
          tags: ["Instances"],
        }),
      ),
    )
    .output(z.number())
    .query(async ({ ctx }) => {
      const [instanceCount] = await ctx.db
        .select({ count: count() })
        .from(instanceTable)
        .where(
          and(
            eq(instanceTable.organizationId, ctx.organizationId),
            isNull(instanceTable.deletedAt),
          ),
        )

      return instanceCount.count
    }),

  create: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/create",
          successStatus: 202,
          summary: "Create a new instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object(createInstanceSchema.shape))
    .output(
      z.object({
        instanceId: z.uuid(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const network = await getCloudNetwork()
      if (!network) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Network not found",
        })
      }

      const macAddress = generateMacAddress()

      const plan = await ctx.db.query.resourcePlanTable.findFirst({
        where: (plan, { or, eq }) =>
          or(
            eq(plan.id, input.resourcePlanId),
            eq(plan.slug, input.resourcePlanId),
          ),
      })

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Resource plan ${input.resourcePlanId} not found`,
        })
      }

      const [sshKey] = await ctx.db
        .select()
        .from(sshKeyTable)
        .where(eq(sshKeyTable.id, input.sshKeyId))

      if (!sshKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `SSH key ${input.sshKeyId} not found`,
        })
      }

      const instance = await ctx.db.transaction(async (tx) => {
        const nextVmid = await getNextVmid(proxmox, tx)
        const instanceHostname = input.hostname.toLowerCase()

        const instanceRow = await tx
          .insert(instanceTable)
          .values({
            cores: plan.cores,
            disk: plan.disk,
            hostname: instanceHostname,
            id: randomUUID(),
            memory: plan.memory,
            networkId: network.id,
            operatingSystemId: input.operatingSystemId,
            organizationId: ctx.organizationId,
            pveNode: PROXMOX_DEFAULT_NODE,
            pveVmid: nextVmid,
            resourcePlanId: plan.id,
            status: "queued",
          })
          .returning()
          .catch((error) => {
            const constraintName = "instance_pve_vmid_unique"
            if (isUniqueConstraintError(error, constraintName)) return null
            throw error
          })

        if (!instanceRow) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `VMID ${nextVmid} already exists`,
          })
        }

        const [newInstance] = instanceRow
        if (!newInstance) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create instance",
          })
        }

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
          throw new TRPCError({
            code: "CONFLICT",
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
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to associate SSH key with instance",
          })
        }

        await createDhcpReservation(
          network.ip.split("/")[0],
          macAddress,
          instanceHostname,
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
        sshKeyId: input.sshKeyId,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Provision job could not be created",
        })
      }

      await logActivity(ctx.db, {
        actorId: ctx.session.session.userId,
        actorType: "user",
        channel: "dashboard",
        metadata: {
          instance: {
            cores: plan.cores,
            disk: plan.disk,
            hostname: input.hostname,
            memory: plan.memory,
          },
          user: {
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            role: ctx.session.user.role,
          },
        },
        organizationId: ctx.organizationId,
        referenceId: instance.id,
        referenceType: "instance",
        type: "instance_provision_requested",
      })

      return {
        instanceId: instance.id,
        jobId,
        message: "Your instance is being created.",
      }
    }),

  delete: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "DELETE",
          path: "/instance/{id}/delete",
          summary: "Delete an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        instanceId: z.uuid(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingInstance = await ctx.db.query.instanceTable.findFirst({
        where: (i, { and, eq }) =>
          and(eq(i.id, input.id), eq(i.organizationId, ctx.organizationId)),
      })

      if (!existingInstance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Instance ${input.id} not found`,
        })
      }

      if (existingInstance.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this instance",
        })
      }

      if (existingInstance.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Instance ${input.id} is already deleted`,
        })
      }

      const instance = await ctx.db.transaction(async (tx) => {
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Instance ${input.id} not found or already deleted`,
          })
        }

        return deletedInstance
      })

      const { jobId } = await addDeleteInstanceJob({
        instanceId: instance.id,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
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
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/instance/{id}/get",
          summary: "Get an instance by ID",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object(selectInstanceSchema.shape))
    .query(async ({ ctx, input }) => {
      const instance = await ctx.db.query.instanceTable.findFirst({
        where: (instance, { eq }) => eq(instance.id, input.id),
        with: {
          ipAllocations: true,
          sshKeys: true,
        },
      })

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Instance ${input.id} not found`,
        })
      }

      if (instance.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to access this instance",
        })
      }

      return instance
    }),

  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          description:
            "List all instances for the active organization of the user. An organization ID can be provided to list instances for a specific organization.",
          method: "GET",
          path: "/instance/list",
          summary: "List an organization's instances",
          tags: ["Instances"],
        }),
      ),
    )
    .input(
      z
        .object({
          limit: z.coerce.number().optional(),
        })
        .optional(),
    )
    .output(z.array(selectInstanceSchema).nullable())
    .query(async ({ ctx }) => {
      const instances = await ctx.db.query.instanceTable.findMany({
        orderBy: (instances, { desc }) => desc(instances.createdAt),
        where: (i, { and, eq }) =>
          and(eq(i.organizationId, ctx.organizationId), isNull(i.deletedAt)),
        with: {
          ipAllocations: true,
          sshKeys: true,
        },
      })

      if (!instances || instances.length === 0) return []

      return instances
    }),

  reboot: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/{id}/reboot",
          summary: "Reboot an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action: InstancePowerAction = "reboot"

      return await powerAction(action, { ctx, input })
    }),

  shutdown: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/{id}/shutdown",
          summary: "Shutdown an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action: InstancePowerAction = "shutdown"

      return await powerAction(action, { ctx, input })
    }),

  start: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/{id}/start",
          summary: "Start an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action: InstancePowerAction = "start"

      return await powerAction(action, { ctx, input })
    }),

  stop: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/{id}/stop",
          summary: "Stop an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action: InstancePowerAction = "stop"

      return await powerAction(action, { ctx, input })
    }),

  update: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "PUT",
          path: "/instance/{id}",
          summary: "Update an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(
      z.object(
        // TODO: expand allowed fields for update
        insertInstanceSchema.pick({
          hostname: true,
          id: true,
        }).shape,
      ),
    )
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.db.query.instanceTable.findFirst({
        where: (i, { and, eq }) =>
          and(eq(i.id, input.id), eq(i.organizationId, ctx.organizationId)),
      })

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Instance ${input.id} not found`,
        })
      }

      const instanceHostname = input.hostname.toLowerCase()

      // TODO: send to update instance queue
      await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(Number(instance.pveVmid))
        .config.$put({
          name: instanceHostname,
        })

      return { id: input.id }
    }),
})

async function powerAction(
  action: InstancePowerAction,
  opts: Pick<
    inferProcedureBuilderResolverOptions<typeof protectedProcedure>,
    "ctx"
  > & { input: { id: string } },
) {
  const { ctx, input } = opts

  const instance = await ctx.db.query.instanceTable.findFirst({
    where: (i, { and, eq }) =>
      and(eq(i.id, input.id), eq(i.organizationId, ctx.organizationId)),
  })

  if (!instance) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Instance ${input.id} not found`,
    })
  }

  const [updated] = await ctx.db
    .update(instanceTable)
    .set({ status: TRANSIENT_STATUS[action] })
    .where(
      and(
        eq(instanceTable.id, instance.id),
        inArray(instanceTable.status, VALID_SOURCE_STATUS[action]),
      ),
    )
    .returning()

  if (!updated) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Cannot ${action} instance while it is ${instance.status}`,
    })
  }

  const { jobId } = await addPowerActionJob({
    action,
    instanceId: instance.id,
  })

  if (!jobId) {
    await ctx.db
      .update(instanceTable)
      .set({ status: updated.status })
      .where(eq(instanceTable.id, instance.id))

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Power action job could not be created",
    })
  }

  return { id: instance.id }
}
