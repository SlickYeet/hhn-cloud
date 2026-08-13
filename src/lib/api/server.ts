import "server-only"

import { createRouterClient } from "@orpc/server"
import { headers } from "next/headers"

import { createORPCContext } from "@/server/api"
import { router } from "@/server/api/routers"

globalThis.$api = createRouterClient(router, {
  context: async () => {
    return createORPCContext({
      headers: await headers(),
    })
  },
})

export const api = globalThis.$api
