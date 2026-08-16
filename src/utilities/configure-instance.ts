import { eq } from "drizzle-orm"
import type { Proxmox } from "proxmox-api"

import { env } from "@/env"
import { generateRootPassword } from "@/helpers/generate-root-password"
import { getCloudNetwork } from "@/helpers/get-cloud-network"
import { db } from "@/server/db"
import { templateTable } from "@/server/db/schema"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const OPNSENSE_CLOUD_NETWORK_VLAN_ID = env.OPNSENSE_CLOUD_NETWORK_VLAN_ID

type ConfigureInstanceParams = {
  nextVmid: number
  templateId: number
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

    const network = await getCloudNetwork()

    if (!network) {
      throw new Error("Failed to retrieve cloud network configuration")
    }

    const config: Omit<Proxmox.nodesQemuConfigVmConfig, "digest"> = {
      agent: "enabled=1,fstrim_cloned_disks=1,freeze-fs=1,type=virtio",
      autostart: true,
      // TODO: if Windows use "bios=ovmf"
      bios: "seabios",
      cipassword: generateRootPassword(),
      ciupgrade: true,
      ciuser: "root",
      cores: template.cores,
      ipconfig0: `gw=${network.gateway},ip=${network.ip}`,
      memory: String(template.memory),
      nameserver: network.gateway,
      net0: `virtio,bridge=vmbr0,tag=${OPNSENSE_CLOUD_NETWORK_VLAN_ID}`,
      sshkeys: encodeURIComponent(""),
    }

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
