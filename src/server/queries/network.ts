import { eq } from "drizzle-orm"

import { env } from "@/env"
import { opnsenseClient } from "@/lib/opnsense"
import { db } from "@/server/db"
import { networkTable } from "@/server/db/schema"
import {
  filterLeasesForVLAN,
  filterReservationsForVLAN,
  filterSubnetForVLAN,
} from "@/server/services/network"

const OPNSENSE_CLOUD_NETWORK_VLAN_ID = env.OPNSENSE_CLOUD_NETWORK_VLAN_ID

async function getNextAvailableIPAddress(): Promise<string> {
  const usedIPs = new Set<string>()

  const leasesData = await opnsenseClient.get("/kea/leases4/search")
  const leases = filterLeasesForVLAN(leasesData.data.rows)

  for (const lease of leases) {
    if (lease.address) {
      usedIPs.add(lease.address)
    }
  }

  const reservationsData = await opnsenseClient.get(
    "/kea/dhcpv4/search_reservation",
  )
  const reservations = filterReservationsForVLAN(reservationsData.data.rows)

  for (const reservation of reservations) {
    if (reservation.ip_address) {
      usedIPs.add(reservation.ip_address)
    }
  }

  const subnetData = await opnsenseClient.get("/kea/dhcpv4/search_subnet")
  const subnet = filterSubnetForVLAN(subnetData.data.rows)

  const [start, end] = subnet.pools
    .split(" - ")
    .map((ip) => parseInt(ip.split(".")[3], 10))

  for (let i = start; i <= end; i++) {
    const ipAddress = `192.168.${OPNSENSE_CLOUD_NETWORK_VLAN_ID}.${i}`
    if (!usedIPs.has(ipAddress)) {
      return ipAddress
    }
  }

  throw new Error("No available IP addresses in the cloud network")
}

export async function getCloudNetwork(): Promise<{
  gateway: string
  id: string
  ip: string
}> {
  try {
    const [network] = await db
      .select()
      .from(networkTable)
      .where(eq(networkTable.vlanId, Number(OPNSENSE_CLOUD_NETWORK_VLAN_ID)))

    if (!network) {
      throw new Error(
        `Cloud network with VLAN ID ${OPNSENSE_CLOUD_NETWORK_VLAN_ID} not found`,
      )
    }

    const nextIPAddress = await getNextAvailableIPAddress()

    if (!nextIPAddress) {
      throw new Error("No available IP addresses in the cloud network")
    }

    return {
      gateway: network.gateway,
      id: network.id,
      ip: `${nextIPAddress}/${network.cidr}`,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}
