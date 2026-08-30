import { SmartCoercionHandlerPlugin } from "@orpc/json-schema"
import { OpenAPIGenerator } from "@orpc/openapi"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins"
import { onError } from "@orpc/server"
import { ZodToJsonSchemaConverter } from "@orpc/zod"

import { GLOBAL_API_KEY_HEADERS } from "@/constants/auth"
import { getBaseUrl } from "@/lib/utils"
import { createRPCContext } from "@/server/api/base"
import { router } from "@/server/api/routers"

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
})

const openAPIHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
  plugins: [
    new SmartCoercionHandlerPlugin({
      converters: [new ZodToJsonSchemaConverter()],
    }),
    new OpenAPIReferenceHandlerPlugin({
      provider: "scalar",
      spec: () =>
        generator.generate(router, {
          base: {
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
              version: "1.0.0",
            },
            servers: [{ url: `${getBaseUrl()}/api/v1` }],
          },
        }),
    }),
  ],
})

async function handleOpenAPIRequest(request: Request) {
  const { matched, response } = await openAPIHandler.handle(request, {
    context: await createRPCContext(request),
    prefix: "/api/v1",
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
