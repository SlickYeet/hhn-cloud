import { eq } from "drizzle-orm"

import { getProxmoxClient } from "@/lib/proxmox"
import { db } from "@/server/db"
import { ipAllocationTable } from "@/server/db/schema"
import {
  destroyInstance,
  stopInstanceIfRunning,
} from "@/server/services/instance"
import { releaseIpAddress } from "@/server/services/network"

const proxmox = getProxmoxClient()

async function main() {
  const instances = await db.query.instanceTable.findMany({
    with: { ipAllocations: true },
  })

  const failures: { instanceId: string; error: unknown }[] = []

  for (const instance of instances) {
    try {
      await stopInstanceIfRunning(proxmox, instance.pveVmid)
      await destroyInstance(proxmox, instance.pveVmid)

      for (const ipAllocation of instance.ipAllocations) {
        await releaseIpAddress(ipAllocation.ipAddress)
        await db
          .delete(ipAllocationTable)
          .where(eq(ipAllocationTable.id, ipAllocation.id))
      }
    } catch (error) {
      console.error(
        `Failed to clean up instance ${instance.id} (VMID ${instance.pveVmid}):`,
        error,
      )
      failures.push({ error, instanceId: instance.id })
    }
  }

  if (failures.length > 0) {
    console.error(`${failures.length} instance(s) failed cleanup - aborting...`)
    process.exit(1)
  }
}

main()
  .then(() => {
    console.info("Pre-reset cleanup completed successfully.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Failed to perform pre-reset cleanup:", error)
    process.exit(1)
  })
