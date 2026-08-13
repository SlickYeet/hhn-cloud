import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin, organization } from "better-auth/plugins"

import { env } from "@/env"
import { db } from "@/server/db"

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [admin(), organization(), nextCookies()],
  socialProviders: {},
})
