import type { Proxmox } from "proxmox-api"

import { env } from "@/env"

const PROXMOX_CLOUD_VM_VMID_RANGE = env.PROXMOX_CLOUD_VM_VMID_RANGE

export async function getNextVmid(proxmox: Proxmox.Api): Promise<number> {
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
      let vmid = PROXMOX_CLOUD_VM_VMID_RANGE[0];
      vmid <= PROXMOX_CLOUD_VM_VMID_RANGE[1];
      vmid++
    ) {
      if (!usedVMIDs.has(vmid)) return vmid
    }

    throw new Error("No available VMIDs in the specified range.")
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}
