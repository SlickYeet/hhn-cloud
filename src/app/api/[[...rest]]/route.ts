import { onError } from "@orpc/client"
import { SmartCoercionPlugin } from "@orpc/json-schema"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"

import { GLOBAL_API_KEY_HEADERS } from "@/constants/auth"
import { getBaseUrl } from "@/lib/utils"
import { createRPCContext } from "@/server/api/base"
import { router } from "@/server/api/routers"

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
        components: {
          securitySchemes: {
            apiKey: {
              in: "header",
              name: GLOBAL_API_KEY_HEADERS[0],
              summary: "API Key Authentication",
              type: "apiKey",
            },
          },
        },
        info: {
          title: "HHN Cloud API",
          version: "1",
        },
        servers: [{ url: `${getBaseUrl()}/api` }],
      },
    }),
  ],
})

async function handleOpenAPIRequest(request: Request) {
  const { matched, response } = await openAPIHandler.handle(request, {
    context: await createRPCContext(request),
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
