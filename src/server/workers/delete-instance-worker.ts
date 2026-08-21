import type { Job } from "bullmq"
import { createNodeRedisClient, Worker } from "bullmq"
import { eq } from "drizzle-orm"

import { getProxmoxClient } from "@/lib/proxmox"
import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import { instanceTable, ipAllocationTable } from "@/server/db/schema"
import {
  destroyInstance,
  stopInstanceIfRunning,
} from "@/server/services/instance"
import { releaseIpAddress } from "@/server/services/network"
import { DELETE_INSTANCE_QUEUE_KEY } from "@/server/workers/delete-instance-queue"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)
const proxmox = getProxmoxClient()

const deleteInstanceWorker = new Worker(
  DELETE_INSTANCE_QUEUE_KEY,
  async (job: Job): Promise<{ status: string; instanceId: string }> => {
    const { instanceId } = job.data

    const instance = await db.query.instanceTable.findFirst({
      where: (instance, { eq }) => eq(instance.id, instanceId),
      with: { ipAllocations: true },
    })

    if (!instance) {
      return { instanceId, status: "deleted" }
    }

    await db
      .update(instanceTable)
      .set({ status: "deleting" })
      .where(eq(instanceTable.id, instanceId))

    await stopInstanceIfRunning(proxmox, instance.pveVmid)
    await destroyInstance(proxmox, instance.pveVmid)

    const ipAllocation = instance.ipAllocations[0]
    if (ipAllocation) {
      await releaseIpAddress(ipAllocation.ipAddress)
      await db
        .delete(ipAllocationTable)
        .where(eq(ipAllocationTable.id, ipAllocation.id))
    }

    await db
      .update(instanceTable)
      .set({ deletedAt: new Date(), status: "deleted" })
      .where(eq(instanceTable.id, instanceId))

    return {
      instanceId,
      status: "deleted",
    }
  },
  {
    autorun: false,
    concurrency: 1,
    connection,
    limiter: { duration: 1000, max: 1 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
)

deleteInstanceWorker.on("completed", (job) => {
  console.info("Delete instance job completed:", job.id, job.returnvalue)
})

deleteInstanceWorker.on("failed", async (job, error) => {
  console.error("Delete instance job failed:", job?.id, error)
  if (job?.data.instanceId) {
    await db
      .update(instanceTable)
      .set({ status: "failed" })
      .where(eq(instanceTable.id, job.data.instanceId))
  }
})

deleteInstanceWorker.run()
