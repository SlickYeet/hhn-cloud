import { env } from "@/env"
import type { Lease, Reservation, Subnet } from "@/schemas/opnsense"

export function filterLeasesForVLAN80(leases: Lease[]): Lease[] | [] {
  const filteredLeases = leases.filter((lease) => lease.if === "vlan0.80")
  return filteredLeases
}

export function filterReservationsForVLAN80(
  reservations: Reservation[] | [],
): Reservation[] {
  const filteredReservations = reservations.filter(
    (reservation) => reservation["%subnet"] === "192.168.80.0/24",
  )
  return filteredReservations
}

export function filterSubnetForVLAN80(subnets: Subnet[]): Subnet {
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
