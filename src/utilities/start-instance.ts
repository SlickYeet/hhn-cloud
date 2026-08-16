import type { Proxmox } from "proxmox-api"

import { env } from "@/env"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE

export async function startInstance(
  proxmox: Proxmox.Api,
  nextVmid: number,
): Promise<{ vmid: number }> {
  try {
    await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(nextVmid)
      .status.start.$post()

    while (true) {
      const newInstance = await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(nextVmid)
        .status.current.$get()

      if (newInstance.status === "running") {
        return newInstance
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}
