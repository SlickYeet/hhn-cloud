import { TRPCError } from "@trpc/server"

import { db } from "@/server/db"
import { getOrgInstanceOrThrow } from "@/server/queries/instance"

export async function getOrgFirewallRuleOrThrow(
  ruleId: string,
  organizationId: string,
  userId: string,
) {
  const rule = await db.query.instanceFirewallRuleTable.findFirst({
    where: (r, { eq }) => eq(r.id, ruleId),
  })

  if (!rule) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Firewall rule not found",
    })
  }

  await getOrgInstanceOrThrow(rule.instanceId, organizationId, userId)

  return rule
}
