import type { Job } from "bullmq"
import { createNodeRedisClient, Worker } from "bullmq"

import { env } from "@/env"
import { getProxmoxClient } from "@/lib/proxmox"
import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import {
  FIREWALL_SYNC_QUEUE_KEY,
  firewallSyncJobSchema,
} from "@/server/queues/firewall-sync-queue"
import {
  buildPlatformRules,
  replaceProxmoxRules,
  toProxmoxRule,
} from "@/server/services/firewall"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)
const proxmox = getProxmoxClient()

const firewallSyncWorker = new Worker(
  FIREWALL_SYNC_QUEUE_KEY,
  async (job: Job): Promise<void> => {
    const { instanceId } = firewallSyncJobSchema.parse(job.data)

    const instance = await db.query.instanceTable.findFirst({
      where: (t, { eq }) => eq(t.id, instanceId),
    })

    if (!instance) return

    const queriedRules = await db.query.instanceFirewallRuleTable.findMany({
      orderBy: (t, { asc }) => asc(t.priority),
      where: (t, { and, eq }) =>
        and(eq(t.instanceId, instanceId), eq(t.enabled, true)),
    })

    const platformRules = buildPlatformRules({
      adminCidr: env.PLATFORM_ADMIN_CIDR,
      organizationId: instance.organizationId,
      subnetCidr: env.CLOUD_NETWORK_CIDR,
    })

    const userRules = queriedRules.map((rule) =>
      toProxmoxRule(rule, { organizationId: instance.organizationId }),
    )

    const fullRuleSet = [...platformRules, ...userRules]

    await replaceProxmoxRules(proxmox, {
      rules: fullRuleSet,
      vmid: instance.pveVmid,
    })
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

firewallSyncWorker.on("completed", (job) => {
  console.info("Firewall sync job completed:", job.id, job.returnvalue)
})

firewallSyncWorker.on("failed", (job, error) => {
  console.error("Firewall sync job failed:", job?.id, error)
})
