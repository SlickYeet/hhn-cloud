import { createNodeRedisClient, Queue } from "bullmq"
import * as z from "zod"

import { getRedisClient } from "@/lib/redis"

export const FIREWALL_SYNC_QUEUE_KEY = "firewall-sync"

let firewallSyncQueue: Queue | null = null

function getFirewallSyncQueue(): Queue {
  if (!firewallSyncQueue) {
    const redis = getRedisClient()
    const connection = createNodeRedisClient(redis)

    firewallSyncQueue = new Queue(FIREWALL_SYNC_QUEUE_KEY, {
      connection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 24 * 3600 },
      },
    })
  }
  return firewallSyncQueue
}

export const firewallSyncJobSchema = z.object({
  instanceId: z.string(),
})

export async function addFirewallSyncJob(
  data: z.infer<typeof firewallSyncJobSchema>,
) {
  const parsed = firewallSyncJobSchema.parse(data)

  const jobId = `${FIREWALL_SYNC_QUEUE_KEY}-${parsed.instanceId}`

  const job = await getFirewallSyncQueue().add(
    FIREWALL_SYNC_QUEUE_KEY,
    parsed,
    { deduplication: { id: jobId }, jobId },
  )

  return { jobId: job.id }
}
