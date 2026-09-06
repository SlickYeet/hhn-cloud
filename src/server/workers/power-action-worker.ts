import { createNodeRedisClient, Worker } from "bullmq"
import { eq } from "drizzle-orm"

import { getProxmoxClient } from "@/lib/proxmox"
import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import { instanceTable } from "@/server/db/schema"
import {
  getInstanceStatusFromProxmox,
  isVmNotFoundError,
  rebootInstance,
  shutdownInstance,
  startInstance,
  stopInstance,
} from "@/server/services/instance"

import {
  addPowerActionSchema,
  POWER_ACTION_QUEUE_KEY,
} from "../queues/power-action-queue"

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)
const proxmox = getProxmoxClient()

const powerActionWorker = new Worker(
  POWER_ACTION_QUEUE_KEY,
  async (job): Promise<{ status: string; vmid: string }> => {
    const data = addPowerActionSchema.parse(job.data)

    const instance = await db.query.instanceTable.findFirst({
      where: (i, { eq }) => eq(i.id, data.instanceId),
    })

    if (!instance) throw new Error("Instance not found")

    try {
      switch (data.action) {
        case "start":
          await startInstance(proxmox, instance.pveVmid)
          break
        case "reboot":
          await rebootInstance(proxmox, instance.pveVmid)
          break
        case "shutdown":
          await shutdownInstance(proxmox, instance.pveVmid)
          break
        case "stop":
          await stopInstance(proxmox, instance.pveVmid)
          break
        default:
          data.action satisfies never
          throw new Error(`Unhandled power action: ${data.action}`)
      }
    } catch (error) {
      if (isVmNotFoundError(error)) {
        console.warn(`Instance ${instance.pveVmid} does not exist.`)
      }
      throw error
    }

    const currentStatus = await getInstanceStatusFromProxmox(proxmox, {
      pveVmid: instance.pveVmid,
    })

    if (currentStatus === "unknown") {
      throw new Error(
        `Instance ${instance.pveVmid} status is unknown. Setting status to 'stopped'.`,
      )
    }

    await db
      .update(instanceTable)
      .set({ status: currentStatus })
      .where(eq(instanceTable.id, instance.id))

    return {
      status: "success",
      vmid: String(instance.pveVmid),
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

powerActionWorker.on("completed", (job) => {
  console.info(`Power action job ${job.id} completed`)
})

powerActionWorker.on("failed", async (job, err) => {
  console.error(`Power action job ${job?.id} failed: ${err.message}`)

  if ((job?.attemptsMade ?? 0) < (job?.opts.attempts ?? 1)) return

  const instanceId = job?.data?.instanceId
  if (typeof instanceId !== "string") return

  const instance = await db.query.instanceTable.findFirst({
    where: (i, { eq }) => eq(i.id, instanceId),
  })

  if (!instance) return

  const currentStatus = await getInstanceStatusFromProxmox(proxmox, {
    pveVmid: instance.pveVmid,
  })

  await db
    .update(instanceTable)
    .set({ status: currentStatus === "unknown" ? "failed" : currentStatus })
    .where(eq(instanceTable.id, instance.id))
})

powerActionWorker.run()
