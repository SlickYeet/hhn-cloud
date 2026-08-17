import { eq } from "drizzle-orm"
import type { Proxmox } from "proxmox-api"

import { env } from "@/env"
import { generateRootPassword } from "@/helpers/generate-root-password"
import { db } from "@/server/db"
import { templateTable } from "@/server/db/schema"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const OPNSENSE_CLOUD_NETWORK_VLAN_ID = env.OPNSENSE_CLOUD_NETWORK_VLAN_ID

type ConfigureInstanceParams = {
  nextVmid: number
  templateId: number
  network: {
    gateway: string
    ip: string
  }
  macAddress: string
}

export async function configureInstance(
  proxmox: Proxmox.Api,
  data: ConfigureInstanceParams,
): Promise<void> {
  try {
    const [template] = await db
      .select()
      .from(templateTable)
      .where(eq(templateTable.pveVmid, data.templateId))

    if (!template) {
      throw new Error(`Template with id ${data.templateId} not found`)
    }

    const config: Omit<Proxmox.nodesQemuConfigVmConfig, "digest"> = {
      agent: "enabled=1,fstrim_cloned_disks=1,freeze-fs=1,type=virtio",
      autostart: true,
      bios: "seabios", // TODO: if Windows use "bios=ovmf"
      cipassword: generateRootPassword(),
      ciupgrade: true,
      ciuser: "root",
      cores: template.cores,
      description: `Cloud instance created from template ${template.name}`,
      ipconfig0: `gw=${data.network.gateway},ip=${data.network.ip}`,
      memory: String(template.memory),
      nameserver: data.network.gateway,
      net0: `virtio,bridge=vmbr0,macaddr=${data.macAddress},tag=${OPNSENSE_CLOUD_NETWORK_VLAN_ID}`,
      searchdomain: "local", // TODO: make configurable
      sshkeys: encodeURIComponent(""), // TODO: add ssh keys
    } as Proxmox.nodesQemuConfigVmConfig

    await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(data.nextVmid)
      .config.$post(config)

    const upid = await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(data.nextVmid)
      .resize.$put({
        disk: "scsi0",
        size: `${template.disk}G`,
      })

    if (!upid) {
      throw new Error(`Failed to configure instance with vmid ${data.nextVmid}`)
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}
