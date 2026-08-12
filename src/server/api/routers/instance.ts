import * as z from "zod"

import { createTRPCRouter, publicProcedure } from "@/server/api/init"
import { instanceTable } from "@/server/db/schema"

export const instanceRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object(instanceTable.$inferInsert))
    .mutation(async ({ input }) => {}),
})
