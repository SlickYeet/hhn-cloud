import proxmoxApi from "proxmox-api"

import { env } from "@/env"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

let proxmoxClient: ReturnType<typeof proxmoxApi> | null = null

function redactHost(message: string): string {
  return message
    .replace(env.PROXMOX_HOST, "[proxmox-host]")
    .replace(/\b\d{1,3}(\.\d{1,3}){3}:\d+\b/g, "[redacted]:[redacted]")
}

function wrapProxmoxErrors<T>(target: T): T {
  if (
    target === null ||
    (typeof target !== "object" && typeof target !== "function")
  ) {
    return target
  }

  return new Proxy(target as object, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver)

      if (typeof value !== "function") {
        return wrapProxmoxErrors(value)
      }

      return (...args: unknown[]) => {
        const result = value.apply(obj, args)

        if (result instanceof Promise) {
          return result.catch((error: unknown) => {
            console.error("Proxmox API call failed", {
              error,
              method: String(prop),
            })
            if (Error instanceof Error) {
              Error.message = redactHost(Error.message)
            }
            throw error
          })
        }
        return wrapProxmoxErrors(result)
      }
    },
  }) as T
}

export function getProxmoxClient() {
  if (proxmoxClient) return proxmoxClient

  const client = proxmoxApi({
    host: env.PROXMOX_HOST,
    port: 8006,
    schema: "https",
    tokenID: env.PROXMOX_TOKEN_ID,
    tokenSecret: env.PROXMOX_TOKEN_SECRET,
  })

  proxmoxClient = wrapProxmoxErrors(client)
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
