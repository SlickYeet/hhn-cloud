import "server-only"

import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type * as React from "react"

import { getQueryClient } from "./query-client"

export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
