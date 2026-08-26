import { RPCJsonSerializer } from "@orpc/client"
import { environmentManager, hashKey, QueryClient } from "@tanstack/react-query"
import { cache } from "react"

const serializer = new RPCJsonSerializer({})

function cancelStreamsOnSuccess(queryClient: QueryClient): void {
  const cancelled = new Set<string>()

  queryClient.getQueryCache().subscribe(({ query }) => {
    if (
      query.state.status !== "success" ||
      query.state.fetchStatus !== "fetching" ||
      cancelled.has(query.queryHash)
    ) {
      return
    }

    cancelled.add(query.queryHash)
    void query.cancel({ silent: true })
  })
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData: (data) => {
          const { json, meta } = serializer.serialize(data)
          return { json, meta }
        },
      },
      hydrate: {
        deserializeData(data) {
          return serializer.deserialize(data)
        },
      },
      queries: {
        queryKeyHashFn: (queryKey) => {
          const { json, meta } = serializer.serialize(queryKey)
          return hashKey([
            json,
            meta?.map((entry) => JSON.stringify(entry)).sort(),
          ])
        },
        refetchOnMount: "always",
        staleTime: 60 * 1000,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export const getQueryClient = cache(() => {
  if (environmentManager.isServer()) {
    const queryClient = makeQueryClient()
    cancelStreamsOnSuccess(queryClient)
    return queryClient
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
})
