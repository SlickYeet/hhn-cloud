import { and, desc, eq } from "drizzle-orm"

import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import type {
  ActivityReferenceTypeEnum,
  ActivityTypeEnum,
} from "@/schemas/activity"
import { activityTable } from "@/server/db/schema"
import type { DB } from "@/server/db/utils"

export async function queryActivity(
  db: DB,
  filters: {
    organizationId: string
    referenceId?: string
    referenceType?: ActivityReferenceTypeEnum
    type?: ActivityTypeEnum
    limit?: number
  },
) {
  const conditions = [eq(activityTable.organizationId, filters.organizationId)]

  if (filters.referenceId)
    conditions.push(eq(activityTable.referenceId, filters.referenceId))
  if (filters.referenceType)
    conditions.push(eq(activityTable.referenceType, filters.referenceType))
  if (filters.type) conditions.push(eq(activityTable.type, filters.type))

  return db.query.activityTable.findMany({
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
    orderBy: desc(activityTable.timestamp),
    where: and(...conditions),
  })
}
