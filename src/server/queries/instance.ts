import { eq } from "drizzle-orm"
import type { Proxmox } from "proxmox-api"

import { env } from "@/env"
import type { db } from "@/server/db"
import { instanceTable } from "@/server/db/schema"

const NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE =
  env.NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE

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

    for (
      let vmid = NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE[0];
      vmid <= NEXT_PUBLIC_PROXMOX_CLOUD_VM_VMID_RANGE[1];
      vmid++
    ) {
      const [instance] = await tx
        .select()
        .from(instanceTable)
        .where(eq(instanceTable.pveVmid, vmid))

      if (!usedVMIDs.has(vmid) && !instance) return vmid
    }

    throw new Error("No available VMIDs in the specified range.")
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}
