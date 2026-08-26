import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"

import { getBaseUrl } from "@/lib/utils"
import type { router } from "@/server/api/routers"

declare global {
  var $client: RouterClient<typeof router> | undefined
}

const link = new RPCLink({
  headers: async () => {
    if (typeof window !== "undefined") return {}
    const { headers } = await import("next/headers")
    return await headers()
  },
  origin: () => {
    if (typeof window === "undefined") {
      throw new Error("This link is not allowed on the server side.")
    }
    return getBaseUrl()
  },
  url: "/rpc",
})

export const client: RouterClient<typeof router> =
  globalThis.$client ?? createORPCClient(link)

export const api = createTanstackQueryUtils(client)
