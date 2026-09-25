import * as z from "zod"

export const roadmapItemSchema = z.object({
  note: z.string().optional(),
  status: z.enum(["completed", "in-progress", "todo"]),
  title: z.string(),
})

export const roadmapCategorySchema = z.object({
  category: z.string(),
  items: z.array(roadmapItemSchema),
})

export type RoadmapCategory = z.infer<typeof roadmapCategorySchema>

export const roadmap = [
  {
    category: "Shipped & shipping",
    items: [
      {
        status: "completed",
        title: "Activity log noise fixed",
      },
      {
        status: "completed",
        title: "Firewall rule editing",
      },
      {
        note: "Mostly done, a few things still need attention",
        status: "in-progress",
        title: "SSH key management",
      },
      {
        status: "completed",
        title: "`ciuser` standardized to `cloud-user`",
      },
      {
        status: "todo",
        title: "`qemu-guest-agent` missing from VM template",
      },
      {
        note: "Additional pages are planned, and existing pages will need improvements.",
        status: "in-progress",
        title: "Instance details",
      },
    ],
  },
  {
    category: "Stuff coming up",
    items: [
      {
        status: "todo",
        title: "Snapshots/backups per instance",
      },
      {
        status: "todo",
        title: "Resource quotas/limits per user or org",
      },
      {
        status: "todo",
        title: "Billing/usage tracking",
      },
      {
        status: "todo",
        title: "Instance templates/images",
      },
      {
        status: "todo",
        title: "SSE upgrade (tRPC v11 + Redis pub/sub)",
      },
      {
        status: "todo",
        title: "Audit/admin dashboard",
      },
      {
        status: "todo",
        title: "Console access (noVNC)",
      },
    ],
  },
  {
    category: "Someday, maybe",
    items: [
      {
        status: "todo",
        title: "Multi-node Proxmox support",
      },
      {
        status: "todo",
        title: "Polish/document `apiKey` plugin for API access",
      },
    ],
  },
  {
    category: "Long-term wishlist",
    items: [
      {
        status: "todo",
        title: "VM migration between nodes",
      },
    ],
  },
] satisfies RoadmapCategory[]
