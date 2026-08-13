import * as z from "zod"

import { publicProcedure } from "@/server/api"
import { selectNetworkSchema } from "@/server/db/schema"

const mockNetworks: z.infer<typeof selectNetworkSchema>[] = [
  {
    createdAt: new Date(),
    id: "network1",
    name: "Network 1",
    network: "192.168.80.0/24",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: "network2",
    name: "Network 2",
    network: "192.168.81.0/24",
    updatedAt: new Date(),
  },
]

export const networkRouter = {
  list: publicProcedure
    .route({
      method: "GET",
      path: "/networks",
      summary: "List all networks",
      tags: ["Networks"],
    })
    .output(z.array(selectNetworkSchema))
    .errors({
      NOT_FOUND: {
        message: "Networks not found",
      },
    })
    .handler(({ context, errors }) => {
      const networks = mockNetworks
      if (!networks) throw errors.NOT_FOUND()
      return networks
    }),
}
