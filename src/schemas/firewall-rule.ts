import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import type {
  firewallRuleActionEnum,
  firewallRuleProtocolEnum,
  firewallRuleSourceTypeEnum,
} from "@/server/db/schema"
import { instanceFirewallRuleTable } from "@/server/db/schema"

const instanceFirewallRuleSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  priority: z.int().min(0).max(1000),
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
  .superRefine((val, ctx) => {
    if (val.sourceType === "cidr" && !val.sourceCidr) {
      ctx.addIssue({
        code: "custom",
        message: "sourceCidr is required when sourceType is 'cidr'",
        path: ["sourceCidr"],
      })
    }
    if (val.sourceType !== "cidr" && val.sourceCidr) {
      ctx.addIssue({
        code: "custom",
        message: "sourceCidr must be omitted unless sourceType is 'cidr'",
        path: ["sourceCidr"],
      })
    }
  })

export type FirewallRuleActionEnum =
  (typeof firewallRuleActionEnum.enumValues)[number]
export type FirewallRuleProtocolEnum =
  (typeof firewallRuleProtocolEnum.enumValues)[number]
export type FirewallRuleSourceTypeEnum =
  (typeof firewallRuleSourceTypeEnum.enumValues)[number]
export type InstanceFirewallRule = typeof instanceFirewallRuleTable.$inferSelect
