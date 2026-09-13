"use client"

import * as React from "react"

import { FIREWALL_RULE_PRIORITY_STEP } from "@/constants/app"
import { api } from "@/lib/api/client"
import type { InstanceFirewallRule } from "@/schemas/firewall-rule"

export function useDebouncedReorder(instanceId: string, delay: number = 400) {
  const utils = api.useUtils()

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevDataRef = React.useRef<
    ReturnType<typeof utils.firewallRule.list.getData> | undefined
  >(undefined)

  // biome-ignore assist/source/useSortedKeys: onMutate must appear before onError for TContext inference
  const reorder = api.firewallRule.reorder.useMutation({
    onMutate: () => ({ prevData: prevDataRef.current }),
    async onSettled() {
      await utils.firewallRule.list.invalidate({ instanceId })
      await utils.instance.firewallStatus.invalidate({ instanceId })
    },
    onError(error, _input, ctx) {
      if (ctx?.prevData) {
        utils.firewallRule.list.setData({ instanceId }, ctx.prevData)
      }
      console.log("Reorder failed:", error)
    },
  })

  return async (orderedRuleIds: string[]) => {
    await utils.firewallRule.list.cancel({ instanceId })
    const prevData = utils.firewallRule.list.getData({ instanceId })
    prevDataRef.current = prevData

    utils.firewallRule.list.setData({ instanceId }, (old) => {
      if (!old) return old

      const byId = new Map(old.map((rule) => [rule.id, rule]))

      return orderedRuleIds
        .map((id, idx) => {
          const rule = byId.get(id)
          return rule
            ? { ...rule, priority: (idx + 1) * FIREWALL_RULE_PRIORITY_STEP }
            : null
        })
        .filter((rule): rule is InstanceFirewallRule => rule !== null)
    })

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      reorder.mutate({ instanceId, orderedRuleIds })
    }, delay)
  }
}
