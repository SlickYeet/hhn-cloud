import { createCallerFactory, createTRPCRouter } from "@/server/api/init"

export const appRouter = createTRPCRouter({})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
