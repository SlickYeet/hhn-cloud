import { eq } from "drizzle-orm"
import type { Proxmox } from "proxmox-api"

import { env } from "@/env"
import { isProxmoxAlreadyExistsError } from "@/lib/proxmox"
import type { ResourcePlan } from "@/schemas/resource-plan"
import { db } from "@/server/db"
import { sshKeyTable } from "@/server/db/schema"
import { syncPlatformFirewallRules } from "@/server/services/firewall"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const PROXMOX_DEFAULT_POOL = env.PROXMOX_POOL
const OPNSENSE_CLOUD_NETWORK_VLAN_ID = env.OPNSENSE_CLOUD_NETWORK_VLAN_ID
const TASK_POLL_INTERVAL_MS = 1000
const TASK_TIMEOUT_MS = 180_000

export async function cloneInstance(
  proxmox: Proxmox.Api,
  data: {
    osVmid: number
    hostname: string
    nextVmid: number
  },
): Promise<void> {
  const upid = await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(data.osVmid)
    .clone.$post({
      full: true,
      name: data.hostname,
      newid: data.nextVmid,
      pool: PROXMOX_DEFAULT_POOL,
    })

  await waitForProxmoxTask(proxmox, upid)
}

export async function configureInstance(
  proxmox: Proxmox.Api,
  data: {
    nextVmid: number
    network: {
      gateway: string
      ip: string
    }
    plan: ResourcePlan
    sshKeyId: string
    macAddress: string
  },
): Promise<void> {
  const [sshKey] = await db
    .select()
    .from(sshKeyTable)
    .where(eq(sshKeyTable.id, data.sshKeyId))

  if (!sshKey) {
    throw new Error(`SSH key with ID ${data.sshKeyId} not found`)
  }

  const config: Omit<Proxmox.nodesQemuConfigVmConfig, "digest"> = {
    agent: "enabled=1,fstrim_cloned_disks=1,freeze-fs=1,type=virtio",
    autostart: true,
    bios: "seabios", // TODO: if Windows use "bios=ovmf"
    ciupgrade: true,
    ciuser: "admin",
    cores: data.plan.cores,
    description: `Cloud instance created from template ${data.plan.name}`,
    ipconfig0: `gw=${data.network.gateway},ip=${data.network.ip}`,
    memory: String(data.plan.memory),
    nameserver: data.network.gateway,
    net0: `model=virtio,bridge=vmbr0,firewall=1,macaddr=${data.macAddress},tag=${OPNSENSE_CLOUD_NETWORK_VLAN_ID}`,
    searchdomain: "local",
    sshkeys: encodeURIComponent(`${sshKey.publicKey}`),
  } as Proxmox.nodesQemuConfigVmConfig

  await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(data.nextVmid)
    .config.$post(config)

  const upid = await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(data.nextVmid)
    .resize.$put({ disk: "scsi0", size: `${data.plan.disk}G` })

  if (!upid) {
    throw new Error(`Failed to configure instance with vmid ${data.nextVmid}`)
  }
}

export async function configureInstanceFirewall(
  proxmox: Proxmox.Api,
  data: {
    adminCidr: string
    hostname: string
    network: {
      ip: string
    }
    organizationId: string
    vmid: number
  },
) {
  const ipsetName = `org_${data.organizationId.toLowerCase()}`

  await proxmox.cluster.firewall.ipset
    .$post({
      comment: data.organizationId,
      name: ipsetName,
    })
    .catch((e) => {
      if (!isProxmoxAlreadyExistsError(e)) throw e
    })

  await proxmox.cluster.firewall.ipset.$(ipsetName).$post({
    cidr: String(data.network.ip),
    comment: data.hostname,
  })

  await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(data.vmid)
    .firewall.options.$put({
      enable: true,
      ipfilter: true,
      policy_in: "DROP",
      policy_out: "ACCEPT",
    })

  await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(data.vmid)
    .firewall.ipset.$post({
      comment: "IP filter for net0",
      name: "ipfilter-net0",
    })

  await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(data.vmid)
    .firewall.ipset.$("ipfilter-net0")
    .$post({
      cidr: String(data.network.ip),
      comment: data.hostname,
    })

  await syncPlatformFirewallRules(proxmox, {
    adminCidr: env.PLATFORM_ADMIN_CIDR,
    organizationId: data.organizationId,
    subnetCidr: env.CLOUD_NETWORK_CIDR,
    vmid: data.vmid,
  })
}

export async function startInstance(
  proxmox: Proxmox.Api,
  nextVmid: number,
): Promise<{ vmid: number }> {
  await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(nextVmid)
    .status.start.$post()

  const deadline = Date.now() + TASK_TIMEOUT_MS

  while (Date.now() < deadline) {
    const current = await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(nextVmid)
      .status.current.$get()

    if (current.status === "running") {
      return { vmid: current.vmid }
    }

    await new Promise((resolve) => setTimeout(resolve, TASK_POLL_INTERVAL_MS))
  }

  throw new Error(`Timed out waiting for instance ${nextVmid} to start`)
}

function isVmNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes("does not exist")
}

export async function stopInstanceIfRunning(
  proxmox: Proxmox.Api,
  vmid: number,
): Promise<void> {
  let instanceStatus: Awaited<ReturnType<typeof getStatus>>

  async function getStatus() {
    return proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(vmid)
      .status.current.$get()
  }

  try {
    instanceStatus = await getStatus()
  } catch (error) {
    if (isVmNotFoundError(error)) {
      console.warn(`Instance ${vmid} does not exist.`)
      return
    }
    throw error
  }

  if (instanceStatus.status !== "running") {
    console.warn(`Instance ${vmid} is not running (${instanceStatus.status}).`)
    return
  }

  const upid = await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(vmid)
    .status.stop.$post()

  await waitForProxmoxTask(proxmox, upid)
}

export async function destroyInstance(
  proxmox: Proxmox.Api,
  vmid: number,
): Promise<void> {
  let upid: string

  try {
    upid = await proxmox.nodes.$(PROXMOX_DEFAULT_NODE).qemu.$(vmid).$delete()
  } catch (error) {
    if (isVmNotFoundError(error)) {
      console.warn(`Instance ${vmid} already destroyed.`)
      return
    }
    console.error(`Error destroying instance with vmid ${vmid}:`, error)
    throw error
  }

  await waitForProxmoxTask(proxmox, upid)
}

async function waitForProxmoxTask(
  proxmox: Proxmox.Api,
  upid: string,
): Promise<void> {
  const deadline = Date.now() + TASK_TIMEOUT_MS

  while (Date.now() < deadline) {
    const task = await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .tasks.$(upid)
      .status.$get()
    if (task.status === "stopped") {
      if (task.exitstatus !== "OK") {
        throw new Error(`Task ${upid} failed: ${task.exitstatus}`)
      }
      return
    }
    await new Promise((resolve) => setTimeout(resolve, TASK_POLL_INTERVAL_MS))
  }

  throw new Error(`Timed out waiting for task ${upid}`)
}
