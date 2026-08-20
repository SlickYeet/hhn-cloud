import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"

import { env } from "@/env"
import type { router } from "@/server/api/routers"

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return env.NEXT_PUBLIC_URL
}

declare global {
  var $client: RouterClient<typeof router> | undefined
}

const link = new RPCLink({
  headers: async () => {
    if (typeof window !== "undefined") return {}
    const { headers } = await import("next/headers")
    return await headers()
  },
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink is not allowed on the server side.")
    }
    return `${getBaseUrl()}/api/orpc`
  },
})

export const client: RouterClient<typeof router> =
  globalThis.$client ?? createORPCClient(link)

export const api = createTanstackQueryUtils(client)
