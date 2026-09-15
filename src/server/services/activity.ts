import { randomUUID } from "node:crypto"
import type * as z from "zod"

import type {
  ActivityType,
  activityUserSchema,
  InsertActivity,
} from "@/schemas/activity"
import { activityRegistry } from "@/schemas/activity"
import { activityTable } from "@/server/db/schema"
import type { DB } from "@/server/db/utils"

type ActorFields =
  | {
      actorType: "user"
      actorId: string
      actorSnapshot: z.infer<typeof activityUserSchema>
    }
  | {
      actorType: "system" | "external"
      actorId?: null
      actorSnapshot?: null
    }

export async function logActivity<T extends ActivityType>(
  db: DB,
  type: T,
  data: Omit<
    InsertActivity,
    "id" | "type" | "actorType" | "actorId" | "actorSnapshot"
  > &
    ActorFields & {
      metadata: z.infer<(typeof activityRegistry)[T]["metadataSchema"]>
    },
) {
  const parsed = activityRegistry[type].metadataSchema.parse(data.metadata)

  await db.insert(activityTable).values({
    id: randomUUID(),
    ...data,
    metadata: parsed,
    type,
  })
}
