import "server-only"

import { createRouterClient } from "@orpc/server"
import { headers } from "next/headers"

import { createRPCContext } from "@/server/api/base"
import { router } from "@/server/api/routers"

globalThis.$client = createRouterClient(router, {
  context: async () =>
    await createRPCContext({
      headers: await headers(),
    }),
})

export const api = globalThis.$client
