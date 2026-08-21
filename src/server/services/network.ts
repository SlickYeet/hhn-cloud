import { isAxiosError } from "axios"

import { env } from "@/env"
import { opnsenseClient } from "@/lib/opnsense"
import type { Lease, Reservation, Subnet } from "@/schemas/opnsense"

const OPNSENSE_CLOUD_NETWORK_VLAN_ID = env.OPNSENSE_CLOUD_NETWORK_VLAN_ID

export async function createDhcpReservation(
  ip: string,
  mac: string,
  hostname: string,
): Promise<void> {
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

function isLeaseNotFoundError(error: unknown): boolean {
  if (isAxiosError(error) && error.response?.status === 500) {
    const message = error.response.data?.errorMessage
    return typeof message === "string" && message.includes("lease not found")
  }
  return false
}

async function removeDhcpLease(ip: string): Promise<void> {
  try {
    const deleteResponse = await opnsenseClient.post(
      `/kea/leases4/del_lease/${ip}`,
    )

    if (deleteResponse.data.status !== "ok") {
      throw new Error(`Failed to delete DHCP lease for ${ip}`)
    }
  } catch (error) {
    if (isLeaseNotFoundError(error)) {
      console.warn(`No DHCP lease found for ${ip}. Nothing to remove.`)
      return
    }
    throw error
  }
}

async function removeDhcpReservation(ip: string): Promise<void> {
  const reservationData = await opnsenseClient.get(
    "/kea/dhcpv4/search_reservation",
  )

  const reservation = reservationData.data.rows.find(
    (reservation: Reservation) => reservation.ip_address === ip,
  )

  if (!reservation) return

  const deleteResponse = await opnsenseClient.post(
    `/kea/dhcpv4/del_reservation/${reservation.uuid}`,
  )

  if (deleteResponse.data.result !== "deleted") {
    throw new Error(
      `Failed to delete DHCP reservation for ${ip} (uuid: ${reservation.uuid})`,
    )
  }

  await opnsenseClient.post("/kea/service/reconfigure")
}

export async function releaseIpAddress(ip: string): Promise<void> {
  await removeDhcpLease(ip)
  await removeDhcpReservation(ip)
}
