import { openapi } from "@orpc/openapi"
import * as z from "zod"

import { selectNetworkSchema } from "@/schemas/network"
import { publicProcedure } from "@/server/api/base"

const mockNetworks: z.infer<typeof selectNetworkSchema>[] = [
  {
    cidr: 24,
    createdAt: new Date(),
    dhcpEnabled: true,
    dnsServers: ["8.8.8.8", "8.8.4.4"],
    gateway: "192.168.80.254",
    id: "network1",
    name: "Network 1",
    network: "192.168.80.0/24",
    updatedAt: new Date(),
    vlanId: 10,
  },
  {
    cidr: 24,
    createdAt: new Date(),
    dhcpEnabled: false,
    dnsServers: ["8.8.8.8", "8.8.4.4"],
    gateway: "192.168.81.254",
    id: "network2",
    name: "Network 2",
    network: "192.168.81.0/24",
    updatedAt: new Date(),
    vlanId: 20,
  },
]

export const networkRouter = {
  list: publicProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/networks",
        summary: "List all networks",
        tags: ["Networks"],
      }),
    )
    .output(z.array(selectNetworkSchema))
    .errors({
      NOT_FOUND: {
        message: "Networks not found",
      },
    })
    .handler(({ errors }) => {
      const networks = mockNetworks
      if (!networks) throw errors.NOT_FOUND()
      return networks
    }),
}
