import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import { env } from "@/env"
import type { router } from "@/server/api/routers"

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return env.NEXT_PUBLIC_URL
}

declare global {
  var $api: RouterClient<typeof router> | undefined
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
    return `${getBaseUrl()}/rpc`
  },
})

export const api: RouterClient<typeof router> =
  globalThis.$api ?? createORPCClient(link)
