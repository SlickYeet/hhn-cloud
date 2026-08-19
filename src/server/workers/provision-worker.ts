import type { Job } from "bullmq"
import { createNodeRedisClient, Worker } from "bullmq"
import { eq } from "drizzle-orm"

import { getProxmoxClient } from "@/lib/proxmox"
import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import { instanceTable } from "@/server/db/schema"
import {
  cloneInstance,
  configureInstance,
  startInstance,
} from "@/server/services/instance"

import { PROVISION_QUEUE_KEY, schema } from "./provision-queue"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)
const proxmox = getProxmoxClient()

const provisionWorker = new Worker(
  PROVISION_QUEUE_KEY,
  async (job: Job): Promise<{ status: string; vmid: string }> => {
    try {
      const data = schema.parse(job.data)

      const [instance] = await db
        .update(instanceTable)
        .set({ status: "provisioning" })
        .where(eq(instanceTable.id, data.instanceId))
        .returning()

      if (!instance) throw new Error("Instance not found")

      // TODO: log new progress
      await cloneInstance(proxmox, {
        hostname: instance.hostname,
        nextVmid: instance.pveVmid,
        templateId: instance.templateId,
      })

      // log new progress
      await configureInstance(proxmox, {
        macAddress: data.macAddress,
        network: data.network,
        nextVmid: instance.pveVmid,
        sshKeyId: data.sshKeyId,
        template: data.template,
      })

      // log new progress
      const newInstance = await startInstance(proxmox, instance.pveVmid)

      // log new progress
      await db
        .update(instanceTable)
        .set({ status: "running" })
        .where(eq(instanceTable.id, data.instanceId))

      // log new progress
      return {
        status: "running",
        vmid: String(newInstance.vmid),
      }
    } catch (error) {
      console.error("Provision job failed:", error)
      throw new Error(error instanceof Error ? error.message : "Unknown error")
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

provisionWorker.on("completed", (job) => {
  console.info("Provision job completed:", job.id, job.returnvalue)
})

provisionWorker.on("failed", async (job, error) => {
  console.error("Worker failed:", job?.id, error)
  if (job?.data.instanceId) {
    await db
      .update(instanceTable)
      .set({ status: "failed" })
      .where(eq(instanceTable.id, job.data.instanceId))
  }
})

provisionWorker.run()
