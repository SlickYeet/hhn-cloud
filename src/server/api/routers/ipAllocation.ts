import * as z from "zod"

import { publicProcedure } from "@/server/api"
import { selectIpAllocationSchema } from "@/server/db/schema"

const mockIpAllocations: z.infer<typeof selectIpAllocationSchema>[] = [
  {
    createdAt: new Date(),
    id: "1",
    ipAddress: "192.168.80.1",
    macAddress: "00:1A:2B:3C:4D:5E",
    network: "192.168.80.0/24",
    networkId: "network1",
    status: "allocated",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "2",
    ipAddress: "192.168.80.2",
    macAddress: "00:1A:2B:3C:4D:5F",
    network: "192.168.80.0/24",
    networkId: "network1",
    status: "allocated",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "2",
    ipAddress: "192.168.81.1",
    macAddress: "00:1A:2B:3C:4D:5F",
    network: "192.168.81.0/24",
    networkId: "network2",
    status: "allocated",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "3",
    ipAddress: "192.168.80.3",
    macAddress: "00:1A:2B:3C:4D:60",
    network: "192.168.80.0/24",
    networkId: "network1",
    status: "allocated",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "4",
    ipAddress: "192.168.80.4",
    macAddress: "00:1A:2B:3C:4D:61",
    network: "192.168.80.0/24",
    networkId: "network1",
    status: "allocated",
    updatedAt: new Date(),
  },
]

export const ipAllocationRouter = {
  list: publicProcedure
    .route({
      method: "GET",
      path: "/ip-allocations",
      summary: "List all IP allocations",
      tags: ["IP Allocations"],
    })
    .output(z.array(selectIpAllocationSchema))
    .errors({
      NOT_FOUND: {
        message: "IP allocations not found",
      },
    })
    .handler(({ context, errors }) => {
      const ipAllocations = mockIpAllocations
      if (!ipAllocations) throw errors.NOT_FOUND()
      return ipAllocations
    }),
}
