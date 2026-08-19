import { env } from "@/env"
import { opnsenseClient } from "@/lib/opnsense"
import type { Lease, Reservation, Subnet } from "@/schemas/opnsense"

const OPNSENSE_CLOUD_NETWORK_VLAN_ID = env.OPNSENSE_CLOUD_NETWORK_VLAN_ID

export async function createDhcpReservation(
  ip: string,
  mac: string,
  hostname: string,
): Promise<void> {
  try {
    const body = {
      hostname,
      hw_address: mac,
      ip_address: ip,
      subnet: env.OPNSENSE_SUBNET_UUID,
    }

    const reservationData = await opnsenseClient.post(
      "/kea/dhcpv4/add_reservation",
      { reservation: body },
    )

    if (reservationData.data.result !== "saved") {
      throw new Error("Failed to create DHCP reservation")
    }

    await opnsenseClient.post("/kea/service/reconfigure")
  } catch (error) {
    console.error("Error creating DHCP reservation:", error)
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}

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
