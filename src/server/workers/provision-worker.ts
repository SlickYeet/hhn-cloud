import type { Job } from "bullmq"
import { createNodeRedisClient, Worker } from "bullmq"

import { getNextVmid } from "@/helpers/get-next-vmid"
import { getProxmoxClient } from "@/lib/proxmox"
import { getRedisClient } from "@/lib/redis"
import { createInstanceSchema } from "@/schemas/instance"
import { cloneInstance } from "@/utilities/clone-instance"
import { configureInstance } from "@/utilities/configure-instance"
import { startInstance } from "@/utilities/start-instance"

import { PROVISION_QUEUE_KEY } from "./provision-queue"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)
const proxmox = getProxmoxClient()

export const provisionWorker = new Worker(
  PROVISION_QUEUE_KEY,
  async (job: Job): Promise<{ status: string; vmid: string }> => {
    try {
      const data = createInstanceSchema.parse(job.data)

      const nextVmid = await getNextVmid(proxmox)
      // TODO: log new progress
      await cloneInstance(proxmox, {
        hostname: data.hostname,
        nextVmid,
        templateId: data.templateId,
      })
      // We can use UPID to track progress in stanges, for each task
      await configureInstance(proxmox, {
        nextVmid,
        templateId: data.templateId,
      })
      // log new progress
      const newInstance = await startInstance(proxmox, nextVmid)
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

// TODO: clean up if worker fails
provisionWorker.on("failed", async (error) => {
  console.error("Worker failed:", error)
  await provisionWorker.close()
})

// TODO: figure out what to do here
provisionWorker.on("completed", async (job) => {
  console.info("Provision job completed:", job.id, job.returnvalue)
  await provisionWorker.close()
})

provisionWorker.run()
