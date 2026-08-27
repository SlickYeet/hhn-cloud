import type { Job } from "bullmq"
import { createNodeRedisClient, Queue } from "bullmq"
import * as z from "zod"

import { getRedisClient } from "@/lib/redis"
import { selectResourcePlanSchema } from "@/schemas/resource-plan"

export const PROVISION_QUEUE_KEY = "cloud-provision-queue"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)

const provisionQueue = new Queue(PROVISION_QUEUE_KEY, {
  connection,
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      delay: 2000,
      type: "exponential",
    },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
})

export const addProvisionJobSchema = z.object({
  instanceId: z.string(),
  macAddress: z.mac(),
  network: z.object({
    gateway: z.ipv4(),
    id: z.string(),
    ip: z.string().refine((val) => {
      const ip = val.split("/")[0]
      return z.ipv4().safeParse(ip).success
    }),
  }),
  plan: selectResourcePlanSchema,
  rootPassword: z.string(),
  sshKeyId: z.string(),
})

export async function addProvisionJob(
  data: z.infer<typeof addProvisionJobSchema>,
): Promise<{ jobId: Job["id"] }> {
  const jobId = `${data.instanceId}-${data.macAddress.replace(/:/g, "-")}`

  const provisionJob = await provisionQueue.add(PROVISION_QUEUE_KEY, data, {
    deduplication: { id: jobId },
    jobId,
  })

  return { jobId: provisionJob.id }
}
