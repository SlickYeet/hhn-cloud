import { oo } from "@orpc/openapi"
import { ORPCError, os } from "@orpc/server"

import { env } from "@/env"
import { auth } from "@/server/auth"
import { db } from "@/server/db"

export async function createORPCContext(opts: { headers: Headers }) {
  const session = await auth.api.getSession({
    headers: opts.headers,
  })

  return {
    db,
    session,
    ...opts,
  }
}

const base = os.$context<Awaited<ReturnType<typeof createORPCContext>>>()

const timingMiddleware = base.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (env.NODE_ENV === "development") {
    const waitMS = Math.floor(Math.random() + 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMS))
  }

  const result = await next()

  const end = Date.now()
  console.log(`Request to ${path} took ${end - start}ms`)

  return result
})

export const publicProcedure = base.use(timingMiddleware)

export const protectedProcedure = base.use(timingMiddleware).use(
  oo.spec(
    base.middleware(async ({ context, next }) => {
      if (!context.session) {
        throw new ORPCError("UNAUTHORIZED")
      }

      return next({
        context: {
          session: { ...context.session, user: context.session.user },
        },
      })
    }),
    {
      security: [{ bearerAuth: [] }],
    },
  ),
)
