import proxmoxApi from "proxmox-api"

import { env } from "@/env"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

let proxmoxClient: ReturnType<typeof proxmoxApi> | null = null

export function getProxmoxClient() {
  if (proxmoxClient) return proxmoxClient

  proxmoxClient = proxmoxApi({
    host: env.PROXMOX_HOST,
    port: 8006,
    schema: "https",
    tokenID: env.PROXMOX_TOKEN_ID,
    tokenSecret: env.PROXMOX_TOKEN_SECRET,
  })

  return proxmoxClient
}

export function isProxmoxAlreadyExistsError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /already exists/i.test(message)
}

export function isProxmoxNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /no such|not found|does not exist/i.test(message)
}
