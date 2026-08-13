import { instanceRouter } from "@/server/api/routers/instance"
import { ipAllocationRouter } from "@/server/api/routers/ipAllocation"
import { networkRouter } from "@/server/api/routers/network"
import { sshKeyRouter } from "@/server/api/routers/sshkey"
import { templateRouter } from "@/server/api/routers/template"

export const router = {
  instance: instanceRouter,
  ipAllocation: ipAllocationRouter,
  network: networkRouter,
  sshKey: sshKeyRouter,
  template: templateRouter,
}
