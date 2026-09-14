import { TRPCError } from "@trpc/server"
import { isNull } from "drizzle-orm"
import type { Proxmox } from "proxmox-api"

import { env } from "@/env"
import { db } from "@/server/db"
import { instanceTable } from "@/server/db/schema"
import { isVmNotFoundError } from "@/server/services/instance"

const NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE =
  env.NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE
const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE

export async function getNextVmid(
  proxmox: Proxmox.Api,
  tx: Parameters<Parameters<(typeof db)["transaction"]>[0]>[0],
): Promise<number> {
  try {
    const clusterVMs = await proxmox.cluster.resources.$get({
      type: "vm",
    })

    if (!Array.isArray(clusterVMs)) {
      throw new Error("Failed to fetch cluster VMs")
    }

    const usedVMIDs = new Set<number>()

    for (const vm of clusterVMs) {
      if (typeof vm.vmid === "number") {
        usedVMIDs.add(vm.vmid)
      }
    }

    const activeRows = await tx
      .select({ vmid: instanceTable.pveVmid })
      .from(instanceTable)
      .where(isNull(instanceTable.deletedAt))

    for (const row of activeRows) usedVMIDs.add(row.vmid)

    for (
      let vmid = NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE[0];
      vmid <= NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE[1];
      vmid++
    ) {
      if (!usedVMIDs.has(vmid)) return vmid
    }

    throw new Error("No available VMIDs in the specified range.")
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}

export async function getInstanceStatusFromProxmox(
  proxmox: Proxmox.Api,
  data: { pveVmid: number },
): Promise<"running" | "stopped" | "unknown"> {
  try {
    const status = await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(data.pveVmid)
      .status.current.$get()

    return status.status === "running" ? "running" : "stopped"
  } catch (error) {
    if (isVmNotFoundError(error)) {
      console.warn(`Instance ${data.pveVmid} does not exist.`)
      return "unknown"
    }
    throw error
  }
}

export async function getOrgInstanceOrThrow(
  instanceId: string,
  organizationId: string,
  userId: string,
  extra?: {
    ipAllocations?: boolean
    sshKeys?: boolean
  },
) {
  const instance = await db.query.instanceTable.findFirst({
    where: (i, { and, eq }) =>
      and(eq(i.id, instanceId), eq(i.organizationId, organizationId)),
    with: {
      ipAllocations: extra?.ipAllocations ? true : undefined,
      organization: {
        with: {
          members: { where: (m, { eq }) => eq(m.userId, userId) },
        },
      },
      sshKeys: extra?.sshKeys ? true : undefined,
    },
  })

  if (!instance || instance.organization.members.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Instance not found",
    })
  }

  return instance
}
