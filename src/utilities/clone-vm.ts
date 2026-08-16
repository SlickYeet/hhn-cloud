import { NextResponse } from "next/server"
import type { Proxmox } from "proxmox-api"

import { env } from "@/env"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const PROXMOX_DEFAULT_POOL = env.PROXMOX_POOL
const TASK_POLL_INTERVAL_MS = 5000
const TASK_TIMEOUT_MS = 10 * 60 * 1000

type CloneVMParams = {
  templateId: number
  hostname: string
  nextVmid: number
}

export async function cloneVM(
  proxmox: Proxmox.Api,
  data: CloneVMParams,
): Promise<string> {
  try {
    const UPID = await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(data.templateId)
      .clone.$post({
        full: true,
        name: data.hostname,
        newid: data.nextVmid,
        pool: PROXMOX_DEFAULT_POOL,
      })

    const startedAt = Date.now()

    while (true) {
      const taskStatus = await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .tasks.$(UPID)
        .status.$get()

      if (taskStatus.status === "stopped") {
        if (taskStatus.exitstatus && taskStatus.exitstatus !== "OK") {
          throw new NextResponse(
            `Clone ${data.nextVmid} failed: ${taskStatus.exitstatus}`,
            { status: 500 },
          )
        }

        return UPID
      }

      if (Date.now() - startedAt > TASK_TIMEOUT_MS) {
        throw new Error(
          `Clone ${data.nextVmid} timed out after ${TASK_TIMEOUT_MS / 1000 / 60} minutes`,
        )
      }

      console.info(`Clone ${data.nextVmid} task status:`, taskStatus.status)
      await new Promise((resolve) => setTimeout(resolve, TASK_POLL_INTERVAL_MS))
    }
  } catch (error) {
    throw new NextResponse(
      `Failed to clone VM ${data.templateId} to ${data.nextVmid}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 },
    )
  }
}
