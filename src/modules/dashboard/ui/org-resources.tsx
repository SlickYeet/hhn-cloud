"use client"

import {
  IconApiApp,
  IconCamera,
  IconKey,
  IconMap,
  IconMapPin,
  IconNetwork,
  IconServer2,
  IconUsers,
  IconWall,
} from "@tabler/icons-react"

import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export function OrgResources() {
  const { data: instanceCount, isLoading: isInstanceCountPending } =
    api.instance.count.useQuery()
  const { data: sshKeyCount, isPending: isSshKeyCountPending } =
    api.sshKey.count.useQuery()
  const { data: primaryIpCount, isPending: isPrimaryIpCountPending } =
    api.ipAllocation.count.useQuery()
  const { data: networkCount, isPending: isNetworkCountPending } =
    api.network.count.useQuery()
  const { data: firewallRuleCount, isPending: isFirewallRuleCountPending } =
    api.firewallRule.count.useQuery()
  // const { data: snapshotCount, isPending: isSnapshotCountPending } = api.snapshot.count.useQuery()
  // const { data: apiKeyCount, isPending: isApiKeyCountPending } = api.apiKey.count.useQuery()
  const { data: memberCount, isPending: isMemberCountPending } =
    api.organization.member.count.useQuery()

  const ORG_RESOURCES = [
    {
      icon: IconServer2,
      isPending: isInstanceCountPending,
      link: "/dashboard/instance/list",
      name: "Instances",
      value: instanceCount || 0,
    },
    {
      icon: IconKey,
      isPending: isSshKeyCountPending,
      name: "SSH Keys",
      value: sshKeyCount || 0,
    },
    {
      icon: IconMapPin,
      isPending: isPrimaryIpCountPending,
      name: "Primary IPs",
      value: primaryIpCount || 0,
    },
    // TODO: per organization networks
    {
      icon: IconNetwork,
      isPending: isNetworkCountPending,
      name: "Networks",
      value: networkCount || 0,
    },
    {
      icon: IconWall,
      isPending: isFirewallRuleCountPending,
      name: "Firewall Rules",
      value: firewallRuleCount || 0,
    },
    {
      icon: IconCamera,
      isPending: false,
      name: "Snapshots",
      value: 0,
    },
    {
      icon: IconApiApp,
      isPending: false,
      name: "API Keys",
      value: 0,
    },
    {
      icon: IconUsers,
      isPending: isMemberCountPending,
      name: "Members",
      value: memberCount || 0,
    },
  ]

  return (
    <div className="flex flex-col rounded-md bg-gray-50 lg:rounded-l-none dark:bg-card">
      <div className="flex items-center justify-between rounded-b-none border-b bg-muted px-4 py-2 lg:rounded-tl-none lg:rounded-tr-md">
        <p className="text-muted-foreground uppercase">Org Resources</p>
        <IconMap className="size-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 max-lg:[&>*:last-child]:rounded-br-md max-lg:[&>*:nth-last-child(2)]:rounded-bl-md">
        {ORG_RESOURCES.map((resource) => {
          const Icon = resource.icon

          return (
            <button
              className={cn(
                "flex items-center gap-3 border px-6 py-4 text-left hover:bg-[color-mix(in_oklch,var(--color-gray-50),var(--foreground)_5%)] dark:hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]",
                resource.link ? "cursor-pointer" : "",
              )}
              key={resource.name}
              onClick={() =>
                resource.link && window.location.assign(resource.link)
              }
              type="button"
            >
              <Icon className="size-7 stroke-[1.5] stroke-primary" />
              <div className="flex flex-col">
                {resource.isPending ? (
                  <div className="h-7 w-10 animate-pulse rounded-md bg-muted" />
                ) : (
                  <p className="font-medium text-xl">{resource.value}</p>
                )}
                <p className="text-muted-foreground">{resource.name}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
