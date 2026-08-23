"use client"

import type { Session } from "better-auth"
import * as React from "react"

import { env } from "@/env"
import { authClient } from "@/lib/auth/client"

export function AuthButtons({ session }: { session?: Session | null }) {
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleLogin() {
    try {
      setIsLoading(true)
      await authClient.signIn.social({
        callbackURL: "/",
        fetchOptions: {
          onError({ error }) {
            console.error(error)
            setIsLoading(false)
          },
        },
        provider: env.NEXT_PUBLIC_OAUTH_PROVIDER_ID,
      })
    } catch (error) {
      console.error(error)
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    try {
      setIsLoading(true)
      await authClient.signOut()
    } catch (error) {
      console.error(error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {session ? (
        <button
          className="rounded-md bg-red-500 px-4 py-2 text-white"
          disabled={isLoading}
          onClick={handleLogout}
          type="button"
        >
          Logout
        </button>
      ) : (
        <button
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
          disabled={isLoading}
          onClick={handleLogin}
          type="button"
        >
          Login
        </button>
      )}
    </div>
  )
}
