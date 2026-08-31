import { Queue } from "bullmq"
import * as z from "zod"

import { getRedisClient } from "@/lib/redis"

export const FIREWALL_SYNC_QUEUE_KEY = "firewall-sync"

export const firewallSyncJobSchema = z.object({
  instanceId: z.string(),
})

const connection = getRedisClient()
const firewallSyncQueue = new Queue(FIREWALL_SYNC_QUEUE_KEY, { connection })

export async function addFirewallSyncJob(
  data: z.infer<typeof firewallSyncJobSchema>,
) {
  const parsed = firewallSyncJobSchema.parse(data)

  const job = await firewallSyncQueue.add("sync", parsed, {
    delay: 2000,
    jobId: `firewall-sync:${parsed.instanceId}`,
  })

  return { jobId: job.id }
}
