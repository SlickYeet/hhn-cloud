import {
  filterLeasesForVLAN80,
  filterReservationsForVLAN80,
  filterSubnetForVLAN80,
} from "@/helpers/filter-for-vlan80"
import { opnsenseClient } from "@/lib/opnsense"

export async function getNextAvailableIPAddress(): Promise<string> {
  try {
    const usedIPs = new Set<string>()

    const leasesData = await opnsenseClient.get("/kea/leases4/search")
    const leases = filterLeasesForVLAN80(leasesData.data.rows)

    for (const lease of leases) {
      if (lease.address) {
        usedIPs.add(lease.address)
      }
    }

    const reservationsData = await opnsenseClient.get(
      "/kea/dhcpv4/search_reservation",
    )
    const reservations = filterReservationsForVLAN80(reservationsData.data.rows)

    for (const reservation of reservations) {
      if (reservation.ip_address) {
        usedIPs.add(reservation.ip_address)
      }
    }

    const subnetData = await opnsenseClient.get("/kea/dhcpv4/search_subnet")
    const subnet = filterSubnetForVLAN80(subnetData.data.rows)

    const [start, end] = subnet.pools
      .split(" - ")
      .map((ip) => parseInt(ip.split(".")[3], 10))

    for (let i = start; i <= end; i++) {
      const ipAddress = `192.168.80.${i}`
      if (!usedIPs.has(ipAddress)) {
        return ipAddress
      }
    }

    throw new Error("No available IP addresses in the cloud network")
  } catch (error) {
    console.error("Failed to fetch leases from OPNsense:", error)
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}
