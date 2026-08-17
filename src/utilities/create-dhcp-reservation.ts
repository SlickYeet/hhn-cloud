import { env } from "@/env"
import { opnsenseClient } from "@/lib/opnsense"

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
