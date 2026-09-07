import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type * as z from "zod"

import type { activityTypeEnum } from "@/server/db/schema"
import { activityTable } from "@/server/db/schema"

export const insertActivitySchema = createInsertSchema(activityTable)
export const selectActivitySchema = createSelectSchema(activityTable)

export type Activity = z.infer<typeof selectActivitySchema>
export type ActivityTypeEnum = (typeof activityTypeEnum.enumValues)[number]
