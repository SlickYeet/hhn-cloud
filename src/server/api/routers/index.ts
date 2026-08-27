import { instanceRouter } from "@/server/api/routers/instance"
import { ipAllocationRouter } from "@/server/api/routers/ipAllocation"
import { networkRouter } from "@/server/api/routers/network"
import { operatingSystemRouter } from "@/server/api/routers/operatingSystem"
import { sshKeyRouter } from "@/server/api/routers/sshkey"

export const router = {
  instance: instanceRouter,
  ipAllocation: ipAllocationRouter,
  network: networkRouter,
  operatingSystem: operatingSystemRouter,
  sshKey: sshKeyRouter,
}
