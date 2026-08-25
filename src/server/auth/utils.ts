import { headers } from "next/headers"
import { cache } from "react"

import { auth } from "@/server/auth"

export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  })
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
