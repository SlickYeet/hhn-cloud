import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { instanceFirewallRuleTable } from "@/server/db/schema"

export const insertInstanceFirewallRuleSchema = createInsertSchema(
  instanceFirewallRuleTable,
)
export const selectInstanceFirewallRuleSchema = createSelectSchema(
  instanceFirewallRuleTable,
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
