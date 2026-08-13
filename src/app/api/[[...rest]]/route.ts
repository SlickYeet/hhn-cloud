import { onError } from "@orpc/client"
import { SmartCoercionPlugin } from "@orpc/json-schema"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"

import { createORPCContext } from "@/server/api"
import { router } from "@/server/api/routers"

const createContext = async (req: Request) => {
  return createORPCContext({
    headers: req.headers,
  })
}

const openAPIHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
  plugins: [
    new SmartCoercionPlugin(),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "HHN Cloud API",
          version: "1",
        },
      },
    }),
  ],
})

async function handleOpenAPIRequest(request: Request) {
  const { matched, response } = await openAPIHandler.handle(request, {
    context: await createContext(request),
    prefix: "/api",
  })

  if (matched) return response

  return new Response("Not Found", { status: 404 })
}

export const HEAD = handleOpenAPIRequest
export const GET = handleOpenAPIRequest
export const POST = handleOpenAPIRequest
export const PUT = handleOpenAPIRequest
export const PATCH = handleOpenAPIRequest
export const DELETE = handleOpenAPIRequest
