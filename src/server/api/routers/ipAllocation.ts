import * as z from "zod"

import { publicProcedure } from "@/server/api"
import { selectIpAllocationSchema } from "@/server/db/schema"

const mockIpAllocations: z.infer<typeof selectIpAllocationSchema>[] = [
  {
    createdAt: new Date(),
    id: "1",
    instanceId: "1",
    ipAddress: "192.168.80.1",
    macAddress: "00:1A:2B:3C:4D:5E",
    networkId: "network1",
    status: "allocated",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "2",
    instanceId: "2",
    ipAddress: "192.168.80.2",
    macAddress: "00:1A:2B:3C:4D:5F",
    networkId: "network1",
    status: "allocated",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "2",
    instanceId: "3",
    ipAddress: "192.168.81.1",
    macAddress: "00:1A:2B:3C:4D:5F",
    networkId: "network2",
    status: "allocated",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "3",
    instanceId: "4",
    ipAddress: "192.168.80.3",
    macAddress: "00:1A:2B:3C:4D:60",
    networkId: "network1",
    status: "allocated",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "4",
    instanceId: "5",
    ipAddress: "192.168.80.4",
    macAddress: "00:1A:2B:3C:4D:61",
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
    .handler(({ errors }) => {
      const ipAllocations = mockIpAllocations
      if (!ipAllocations) throw errors.NOT_FOUND()
      return ipAllocations
    }),
}
