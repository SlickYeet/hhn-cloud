import { env } from "@/env"
import type { Lease, Reservation, Subnet } from "@/schemas/opnsense"

const OPNSENSE_CLOUD_NETWORK_VLAN_ID = env.OPNSENSE_CLOUD_NETWORK_VLAN_ID

export function filterLeasesForVLAN(leases: Lease[]): Lease[] | [] {
  const filteredLeases = leases.filter(
    (lease) => lease.if === `vlan0.${OPNSENSE_CLOUD_NETWORK_VLAN_ID}`,
  )
  return filteredLeases
}

export function filterReservationsForVLAN(
  reservations: Reservation[] | [],
): Reservation[] {
  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation["%subnet"] ===
      `192.168.${OPNSENSE_CLOUD_NETWORK_VLAN_ID}.0/24`,
  )
  return filteredReservations
}

export function filterSubnetForVLAN(subnets: Subnet[]): Subnet {
  const filteredSubnet = subnets.find(
    (subnet) => subnet.uuid === env.OPNSENSE_SUBNET_UUID,
  )
  if (!filteredSubnet) {
    throw new Error(
      `Subnet with UUID ${env.OPNSENSE_SUBNET_UUID} not found in OPNsense`,
    )
  }
  return filteredSubnet
}
