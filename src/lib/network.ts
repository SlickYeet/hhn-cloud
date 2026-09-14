import type { FirewallRuleSourceTypeEnum } from "@/schemas/firewall-rule"

function isValidNetworkCidr(cidr: string): boolean {
  const match = cidr.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/,
  )

  if (!match) return false

  const [_, oct1, oct2, oct3, oct4, prefixLength] = match
  const octets = [oct1, oct2, oct3, oct4].map(Number)

  if (octets.some((octet) => octet > 255)) return false
  if (prefixLength === undefined || prefixLength === "32") return true

  const prefix = Number(prefixLength)
  if (prefix > 32) return false

  const ip =
    (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  const network = ip & mask

  return ip === network
}

export function validateSourcePair(
  sourceType: FirewallRuleSourceTypeEnum,
  sourceCidr: string | null | undefined,
): string | null {
  if (sourceType === "cidr" && !sourceCidr) {
    return "sourceCidr is required when sourceType is 'cidr'"
  }
  if (sourceType !== "cidr" && sourceCidr) {
    return "sourceCidr must be omitted unless sourceType is 'cidr'"
  }
  if (sourceType === "cidr" && sourceCidr && !isValidNetworkCidr(sourceCidr)) {
    return "CIDR must be a valid network address (e.g. 192.168.80.0/24) or a single host (e.g. 192.168.80.20)"
  }
  return null
}
