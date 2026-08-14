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
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NODE_ENV: process.env.NODE_ENV,
    PROXMOX_HOST: process.env.PROXMOX_HOST,
    PROXMOX_NODE: process.env.PROXMOX_NODE,
    PROXMOX_POOL: process.env.PROXMOX_POOL,
    PROXMOX_TOKEN_ID: process.env.PROXMOX_TOKEN_ID,
    PROXMOX_TOKEN_SECRET: process.env.PROXMOX_TOKEN_SECRET,
    REDIS_URL: process.env.REDIS_URL,
  },
  server: {
    BETTER_AUTH_SECRET: z.string(),
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PROXMOX_HOST: z.string(),
    PROXMOX_NODE: z.string(),
    PROXMOX_POOL: z.string(),
    PROXMOX_TOKEN_ID: z.string(),
    PROXMOX_TOKEN_SECRET: z.string(),
    REDIS_URL: z.url(),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
