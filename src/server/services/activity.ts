import { randomUUID } from "node:crypto"

import type { InsertActivity } from "@/schemas/activity"
import { activityTable } from "@/server/db/schema"
import type { DB } from "@/server/db/utils"

export async function logActivity(db: DB, data: Omit<InsertActivity, "id">) {
  await db.insert(activityTable).values({
    id: randomUUID(),
    ...data,
  })
}
