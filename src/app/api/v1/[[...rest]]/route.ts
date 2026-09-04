import { SmartCoercionHandlerPlugin } from "@orpc/json-schema"
import { OpenAPIGenerator } from "@orpc/openapi"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins"
import { onError } from "@orpc/server"
import { ZodToJsonSchemaConverter } from "@orpc/zod"
import type { NextRequest } from "next/server"

import { GLOBAL_API_KEY_HEADERS } from "@/constants/auth"
import { env } from "@/env"
import { getBaseUrl } from "@/lib/utils"
import { createTRPCContext } from "@/server/api/init"
import { orpcRouter } from "@/server/api/root"

async function createContext(req: NextRequest) {
  return createTRPCContext({ headers: req.headers })
}

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
})

const openAPIHandler = new OpenAPIHandler(orpcRouter, {
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
        generator.generate(orpcRouter, {
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
              version: env.NEXT_PUBLIC_API_VERSION,
            },
            servers: [{ url: `${getBaseUrl()}/api/v1` }],
          },
        }),
    }),
  ],
})

async function handleOpenAPIRequest(request: NextRequest) {
  const { matched, response } = await openAPIHandler.handle(request, {
    context: await createContext(request),
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
