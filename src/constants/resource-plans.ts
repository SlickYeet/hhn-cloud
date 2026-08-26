import * as z from "zod"

export const RESOURCE_PLANS = [
  {
    cores: 1,
    description: "1 vCPU, 512MB RAM, 10GB Disk",
    disabled: false,
    disk: 10,
    id: "micro",
    memory: 512,
    name: "Micro",
  },
  {
    cores: 2,
    description: "2 vCPU, 1GB RAM, 20GB Disk",
    disabled: false,
    disk: 20,
    id: "small",
    memory: 1024,
    name: "Small",
  },
  {
    cores: 4,
    description: "4 vCPU, 2GB RAM, 40GB Disk",
    disabled: false,
    disk: 40,
    id: "medium",
    memory: 2048,
    name: "Medium",
  },
  {
    cores: 8,
    description: "8 vCPU, 4GB RAM, 80GB Disk",
    disabled: false,
    disk: 80,
    id: "large",
    memory: 4096,
    name: "Large",
  },
  {
    cores: 16,
    description: "16 vCPU, 8GB RAM, 160GB Disk",
    disabled: true,
    disk: 160,
    id: "xlarge",
    memory: 8192,
    name: "X-Large",
  },
  {
    cores: 32,
    description: "32 vCPU, 16GB RAM, 320GB Disk",
    disabled: true,
    disk: 320,
    id: "2xlarge",
    memory: 16384,
    name: "2X-Large",
  },
] as const

export const RESOURCE_PLANS_ENUM = z.enum(RESOURCE_PLANS.map((plan) => plan.id))
export const RESOURCE_PLANS_ZOD_OBJECT = z.object({
  cores: z.number(),
  description: z.string(),
  disabled: z.boolean(),
  disk: z.number(),
  id: RESOURCE_PLANS_ENUM,
  memory: z.number(),
  name: z.string(),
})

export type ResourcePlan = z.infer<typeof RESOURCE_PLANS_ZOD_OBJECT>
