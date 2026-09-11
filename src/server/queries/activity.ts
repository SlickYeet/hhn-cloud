import { and, desc, eq, lt, or } from "drizzle-orm"

import type {
  ActivityReferenceTypeEnum,
  ActivityTypeEnum,
} from "@/schemas/activity"
import { activityTable } from "@/server/db/schema"
import type { DB } from "@/server/db/utils"

export async function queryActivity(
  db: DB,
  filters: {
    cursor?: { id: string; timestamp: Date } | null
    limit: number
    organizationId: string
    referenceId?: string
    referenceType?: ActivityReferenceTypeEnum
    type?: ActivityTypeEnum
  },
) {
  const conditions = [eq(activityTable.organizationId, filters.organizationId)]

  if (filters.cursor) {
    const cursorCondition = or(
      lt(activityTable.timestamp, filters.cursor.timestamp),
      and(
        eq(activityTable.id, filters.cursor.id),
        eq(activityTable.timestamp, filters.cursor.timestamp),
      ),
    )
    if (cursorCondition) conditions.push(cursorCondition)
  }
  if (filters.referenceId)
    conditions.push(eq(activityTable.referenceId, filters.referenceId))
  if (filters.referenceType)
    conditions.push(eq(activityTable.referenceType, filters.referenceType))
  if (filters.type) conditions.push(eq(activityTable.type, filters.type))

  const activity = await db.query.activityTable.findMany({
    limit: filters.limit,
    orderBy: desc(activityTable.timestamp),
    where: and(...conditions),
  })

  const hasMore = activity.length > filters.limit
  const items = hasMore ? activity.slice(0, -1) : activity
  const lastItem = items[items.length - 1]
  const nextCursor = hasMore
    ? { id: lastItem.id, timestamp: lastItem.timestamp }
    : null

  return {
    items,
    nextCursor,
  }
}
