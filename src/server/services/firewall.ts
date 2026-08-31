import type { Proxmox } from "proxmox-api"

import { env } from "@/env"
import { isProxmoxNotFoundError } from "@/lib/proxmox"
import type { InstanceFirewallRule } from "@/schemas/firewall-rule"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE

export interface ProxmoxFirewallRuleInput {
  action: "ACCEPT" | "DROP"
  comment?: string
  enable: 1
  dport?: string
  proto?: "tcp" | "udp" | "icmp"
  source?: string
  type: "in"
  pos?: number
}

interface PlatformRulesInput {
  adminCidr: string
  organizationId: string
  subnetCidr: string // cloud network
}

export function buildPlatformRules({
  adminCidr,
  organizationId,
  subnetCidr,
}: PlatformRulesInput): ProxmoxFirewallRuleInput[] {
  const ipsetName = `org_${organizationId.toLowerCase()}`

  return [
    {
      action: "ACCEPT",
      comment: `Allow access from organization ${organizationId.toLowerCase()}`,
      enable: 1,
      pos: 0, // always first rule
      source: `+${ipsetName}`,
      type: "in",
    },
    {
      action: "ACCEPT",
      comment: "Platform operator SSH access",
      dport: "22",
      enable: 1,
      pos: 1, // always second rule
      proto: "tcp",
      source: adminCidr,
      type: "in",
    },
    {
      action: "DROP",
      comment: "Deny other tenants on shared subnet",
      enable: 1,
      pos: 9999, // always last rule
      source: subnetCidr,
      type: "in",
    },
  ]
}

export function toProxmoxRule(
  rule: InstanceFirewallRule,
  context: { organizationId: string },
): ProxmoxFirewallRuleInput {
  const source =
    rule.sourceType === "cidr"
      ? (rule.sourceCidr ?? undefined)
      : rule.sourceType === "self"
        ? `+org_${context.organizationId.toLowerCase()}`
        : undefined

  return {
    action: rule.action,
    comment: rule.comment ?? undefined,
    dport: rule.protocol === "icmp" ? undefined : (rule.portRange ?? undefined),
    enable: 1,
    pos: rule.priority,
    proto: rule.protocol === "any" ? undefined : rule.protocol,
    source,
    type: "in",
  }
}

export async function replaceProxmoxRules(
  proxmox: Proxmox.Api,
  data: {
    rules: ProxmoxFirewallRuleInput[]
    vmid: number
  },
) {
  const existingRules = await proxmox.nodes
    .$(PROXMOX_DEFAULT_NODE)
    .qemu.$(data.vmid)
    .firewall.rules.$get()

  const byDescendingPos = [...existingRules].sort((a, b) => b.pos - a.pos)

  for (const rule of byDescendingPos) {
    await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(data.vmid)
      .firewall.rules.$(String(rule.pos))
      .$delete()
      .catch((e) => {
        if (!isProxmoxNotFoundError(e)) throw e
      })
  }

  for (const rule of data.rules) {
    await proxmox.nodes
      .$(PROXMOX_DEFAULT_NODE)
      .qemu.$(data.vmid)
      .firewall.rules.$post(rule)
  }
}

export async function syncPlatformFirewallRules(
  proxmox: Proxmox.Api,
  data: {
    adminCidr: string
    organizationId: string
    subnetCidr: string
    vmid: number
  },
) {
  const platformRules = buildPlatformRules({
    adminCidr: data.adminCidr,
    organizationId: data.organizationId,
    subnetCidr: data.subnetCidr,
  })

  await replaceProxmoxRules(proxmox, {
    rules: platformRules,
    vmid: data.vmid,
  })
}
