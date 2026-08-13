import * as z from "zod"

import { publicProcedure } from "@/server/api"
import { selectInstanceSchema } from "@/server/db/schema"

export const instanceRouter = {
  getAll: publicProcedure
    .route({ method: "GET" })
    .output(z.array(selectInstanceSchema))
    .handler(() => {
      return [
        {
          createdAt: new Date(),
          id: "1",
          ipAddress: "192.168.1.1",
          macAddress: "00:1A:2B:3C:4D:5E",
          name: "Instance 1",
          pveNode: "node1",
          pveVmid: 101,
          status: "running",
          templateId: "template1",
          updatedAt: new Date(),
        },
        {
          createdAt: new Date(),
          id: "2",
          ipAddress: "192.168.1.2",
          macAddress: "00:1A:2B:3C:4D:5F",
          name: "Instance 2",
          pveNode: "node2",
          pveVmid: 102,
          status: "queued",
          templateId: "template2",
          updatedAt: new Date(),
        },
      ]
    }),
}
