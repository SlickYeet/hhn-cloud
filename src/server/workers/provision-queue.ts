import { randomUUID } from "node:crypto"
import type { Job } from "bullmq"
import { createNodeRedisClient, Queue } from "bullmq"
import type * as z from "zod"

import { getRedisClient } from "@/lib/redis"
import type { createInstanceSchema } from "@/schemas/instance"

export const PROVISION_QUEUE_KEY = "cloud-provision-queue"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)

const provisionQueue = new Queue(PROVISION_QUEUE_KEY, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      delay: 2000,
      type: "exponential",
    },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
})

export async function addProvisionJob(
  data: z.infer<typeof createInstanceSchema>,
): Promise<{ id: Job["id"]; status: string }> {
  const jobId = `${data.hostname}-${data.templateId}-${randomUUID()}`

  const provisionJob = await provisionQueue.add(PROVISION_QUEUE_KEY, data, {
    deduplication: {
      id: jobId,
    },
    jobId,
  })

  return {
    id: provisionJob.id,
    status: "queued",
  }
}
