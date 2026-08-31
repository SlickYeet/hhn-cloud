import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { instanceFirewallRuleTable } from "@/server/db/schema"

const instanceFirewallRuleSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  priority: z.int().min(1).max(100),
  updatedAt: z.coerce.date().optional(),
}

export const insertInstanceFirewallRuleSchema = createInsertSchema(
  instanceFirewallRuleTable,
  instanceFirewallRuleSchemaConstraints,
)
export const selectInstanceFirewallRuleSchema = createSelectSchema(
  instanceFirewallRuleTable,
  instanceFirewallRuleSchemaConstraints,
)

export const createInstanceFirewallRuleSchema = insertInstanceFirewallRuleSchema
  .omit({
    createdAt: true,
    id: true,
    updatedAt: true,
  })
  // require sourceCidr when sourceType is "cidr"
  .refine((data) => {
    if (data.sourceType === "cidr") {
      return data.sourceCidr !== undefined && data.sourceCidr !== ""
    }
    return true
  })

export type InstanceFirewallRule = typeof instanceFirewallRuleTable.$inferSelect
