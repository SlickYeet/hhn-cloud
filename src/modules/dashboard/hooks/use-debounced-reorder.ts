"use client"

import * as React from "react"

import { api } from "@/lib/api/client"

export function useDebouncedReorder(instanceId: string, delay: number = 400) {
  const utils = api.useUtils()

  const [timer, setTimer] = React.useState<ReturnType<
    typeof setTimeout
  > | null>(null)

  const reorder = api.firewallRule.reorder.useMutation({
    async onSuccess() {
      await utils.firewallRule.list.invalidate()
    },
  })

  return (orderedRuleIds: string[]) => {
    if (timer) clearTimeout(timer)
    const t = setTimeout(() => {
      reorder.mutate({ instanceId, orderedRuleIds })
    }, delay)
    setTimer(t)
  }
}
