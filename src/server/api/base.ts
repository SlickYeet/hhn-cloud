import { oo } from "@orpc/openapi"
import { ORPCError, os } from "@orpc/server"

import { env } from "@/env"
import { auth } from "@/server/auth"
import { db } from "@/server/db"

export async function createRPCContext(opts: { headers: Headers }) {
  const session = await auth.api.getSession({
    headers: opts.headers,
  })

  return {
    db,
    headers: opts.headers,
    session,
  }
}

const base = os.$context<Awaited<ReturnType<typeof createRPCContext>>>()

const timingMiddleware = base.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (env.NODE_ENV === "development") {
    const waitMS = Math.floor(Math.random() + 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMS))
  }

  const result = await next()

  const end = Date.now()
  console.info(`Request to /${path.join("/")} took ${end - start}ms`)

  return result
})

const authMiddleware = oo.spec(
  base.middleware(async ({ context, next }) => {
    if (!context.session?.user) {
      throw new ORPCError("UNAUTHORIZED")
    }

    return next({
      context: {
        session: { ...context.session, user: context.session.user },
      },
    })
  }),
  { security: [{ apiKey: [] }] },
)

export const publicProcedure = base.use(timingMiddleware)

export const protectedProcedure = base.use(timingMiddleware).use(authMiddleware)
