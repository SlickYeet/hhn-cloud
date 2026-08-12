import { createCallerFactory, createTRPCRouter } from "@/server/api/init"
import { instanceRouter } from "@/server/api/routers/instance"

export const appRouter = createTRPCRouter({
  instance: instanceRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
