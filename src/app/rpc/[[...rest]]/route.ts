import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"

import { env } from "@/env"
import { createORPCContext } from "@/server/api"
import { router } from "@/server/api/routers"

const createContext = async (req: Request) => {
  return createORPCContext({
    headers: req.headers,
  })
}

const handler = new RPCHandler(router, {
  interceptors: [
    onError(
      env.NODE_ENV === "development"
        ? (error) => {
            console.error(
              `Error in RPC request: ${error instanceof Error ? error.message : String(error)}`,
            )
          }
        : () => undefined,
    ),
  ],
})

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    context: await createContext(request),
    prefix: "/rpc",
  })

  return response ?? new Response("Not found", { status: 404 })
}

export const HEAD = handleRequest
export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
