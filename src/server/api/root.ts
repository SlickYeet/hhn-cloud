import { toORPCRouter } from "@orpc/trpc"

import { firewallRuleRouter } from "@/server/api/routers/firewall-rule"
import { instanceRouter } from "@/server/api/routers/instance"
import { ipAllocationRouter } from "@/server/api/routers/ip-allocation"
import { networkRouter } from "@/server/api/routers/network"
import { operatingSystemRouter } from "@/server/api/routers/operating-system"
import { organizationRouter } from "@/server/api/routers/organization"
import { resourcePlanRouter } from "@/server/api/routers/resource-plan"
import { sshKeyRouter } from "@/server/api/routers/sshkey"

import { createCallerFactory, createTRPCRouter } from "./init"

export const appRouter = createTRPCRouter({
  firewallRule: firewallRuleRouter,
  instance: instanceRouter,
  ipAllocation: ipAllocationRouter,
  network: networkRouter,
  operatingSystem: operatingSystemRouter,
  organization: organizationRouter,
  resourcePlan: resourcePlanRouter,
  sshKey: sshKeyRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)

export const orpcRouter = toORPCRouter(appRouter)
