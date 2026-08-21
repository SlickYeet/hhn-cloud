import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  client: {
    NEXT_PUBLIC_URL: z.url(),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    ENCRYPTION_KEY_V1: process.env.ENCRYPTION_KEY_V1,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NODE_ENV: process.env.NODE_ENV,
    OPNSENSE_API_ENDPOINT: process.env.OPNSENSE_API_ENDPOINT,
    OPNSENSE_API_KEY: process.env.OPNSENSE_API_KEY,
    OPNSENSE_API_SECRET: process.env.OPNSENSE_API_SECRET,
    OPNSENSE_CLOUD_NETWORK_VLAN_ID: process.env.OPNSENSE_CLOUD_NETWORK_VLAN_ID,
    OPNSENSE_SUBNET_UUID: process.env.OPNSENSE_SUBNET_UUID,
    PROXMOX_CLOUD_VM_VMID_RANGE: process.env.PROXMOX_CLOUD_VM_VMID_RANGE,
    PROXMOX_HOST: process.env.PROXMOX_HOST,
    PROXMOX_NODE: process.env.PROXMOX_NODE,
    PROXMOX_POOL: process.env.PROXMOX_POOL,
    PROXMOX_TEMPLATE_VMID_RANGE: process.env.PROXMOX_TEMPLATE_VMID_RANGE,
    PROXMOX_TOKEN_ID: process.env.PROXMOX_TOKEN_ID,
    PROXMOX_TOKEN_SECRET: process.env.PROXMOX_TOKEN_SECRET,
    REDIS_URL: process.env.REDIS_URL,
  },
  server: {
    BETTER_AUTH_SECRET: z.string(),
    DATABASE_URL: z.url(),
    ENCRYPTION_KEY_V1: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OPNSENSE_API_ENDPOINT: z.string(),
    OPNSENSE_API_KEY: z.string(),
    OPNSENSE_API_SECRET: z.string(),
    OPNSENSE_CLOUD_NETWORK_VLAN_ID: z.string(),
    OPNSENSE_SUBNET_UUID: z.uuid(),
    PROXMOX_CLOUD_VM_VMID_RANGE: z.string().transform((value) => {
      try {
        const parsed = JSON.parse(value)
        if (!Array.isArray(parsed) || parsed.length !== 2) {
          throw new Error(
            "PROXMOX_CLOUD_VM_VMID_RANGE must be a JSON array with two elements",
          )
        }
        const [min, max] = parsed
        if (typeof min !== "number" || typeof max !== "number") {
          throw new Error(
            "PROXMOX_CLOUD_VM_VMID_RANGE elements must be numbers",
          )
        }
        return [min, max] as [number, number]
      } catch (error) {
        throw new Error(
          `Invalid PROXMOX_CLOUD_VM_VMID_RANGE: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }),
    PROXMOX_HOST: z.string(),
    PROXMOX_NODE: z.string(),
    PROXMOX_POOL: z.string(),
    PROXMOX_TEMPLATE_VMID_RANGE: z.string().transform((value) => {
      try {
        const parsed = JSON.parse(value)
        if (!Array.isArray(parsed) || parsed.length !== 2) {
          throw new Error(
            "PROXMOX_TEMPLATE_VMID_RANGE must be a JSON array with two elements",
          )
        }
        const [min, max] = parsed
        if (typeof min !== "number" || typeof max !== "number") {
          throw new Error(
            "PROXMOX_TEMPLATE_VMID_RANGE elements must be numbers",
          )
        }
        return [min, max] as [number, number]
      } catch (error) {
        throw new Error(
          `Invalid PROXMOX_TEMPLATE_VMID_RANGE: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }),
    PROXMOX_TOKEN_ID: z.string(),
    PROXMOX_TOKEN_SECRET: z.string(),
    REDIS_URL: z.url(),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
