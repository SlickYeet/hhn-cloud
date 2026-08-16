import { eq } from "drizzle-orm"

import { env } from "@/env"
import { getNextAvailableIPAddress } from "@/helpers/get-next-available-ip-address"
import { db } from "@/server/db"
import { networkTable } from "@/server/db/schema"

const OPNSENSE_CLOUD_NETWORK_VLAN_ID = env.OPNSENSE_CLOUD_NETWORK_VLAN_ID

export async function getCloudNetwork(): Promise<{
  gateway: string
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
      ip: `${nextIPAddress}/${network.cidr}`,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}
