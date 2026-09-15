import type { Icon as IconType } from "@tabler/icons-react"
import { IconKey, IconServer2, IconUser, IconWall } from "@tabler/icons-react"
import { userSchema } from "better-auth"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { selectInstanceFirewallRuleSchema } from "@/schemas/firewall-rule"
import {
  instancePowerActionEnum,
  selectInstanceSchema,
} from "@/schemas/instance"
import type { activityReferenceTypeEnum } from "@/server/db/schema"
import { activityTable } from "@/server/db/schema"

type ActivityTypeConfig<T extends z.ZodType> = {
  icon: IconType
  metadataSchema: T
  render: (metadata: z.infer<T>) => string
}

export const activityUserSchema = userSchema.pick({
  email: true,
  id: true,
  image: true,
  name: true,
})

const activityInstanceSchema = selectInstanceSchema.pick({
  hostname: true,
  id: true,
  organizationId: true,
})

function activityType<T extends z.ZodType>(
  config: ActivityTypeConfig<T>,
): ActivityTypeConfig<T> {
  return config
}

export const activityRegistry = {
  firewall_rule_created: {
    icon: IconWall,
    metadataSchema: z.object({}),
    render: () => "Created firewall rule",
  },
  firewall_rule_deleted: {
    icon: IconWall,
    metadataSchema: z.object({}),
    render: () => "Deleted firewall rule",
  },
  firewall_rule_reordered: {
    icon: IconWall,
    metadataSchema: z.object({
      ruleIds: z.array(z.uuid()),
    }),
    render: () => "Reordered firewall rules",
  },
  firewall_rule_updated: {
    icon: IconWall,
    metadataSchema: z.object({
      after: selectInstanceFirewallRuleSchema.partial(),
      before: selectInstanceFirewallRuleSchema.partial(),
    }),
    render: () => "Updated firewall rule",
  },
  firewall_sync_completed: {
    icon: IconWall,
    metadataSchema: z.object({}),
    render: () => "Completed firewall sync",
  },
  firewall_sync_failed: {
    icon: IconWall,
    metadataSchema: z.object({
      error: z.string(),
    }),
    render: () => "Failed firewall sync",
  },
  firewall_sync_retry_requested: {
    icon: IconWall,
    metadataSchema: z.object({}),
    render: () => "Retrying firewall sync",
  },
  instance_created: {
    icon: IconServer2,
    metadataSchema: z.object({}),
    render: () => "Created instance",
  },
  instance_deleted: {
    icon: IconServer2,
    metadataSchema: z.object({}),
    render: () => "Deleted instance",
  },
  instance_deletion_failed: {
    icon: IconServer2,
    metadataSchema: z.object({
      error: z.string(),
      instance: activityInstanceSchema,
    }),
    render: () => "Failed instance deletion",
  },
  instance_deletion_requested: {
    icon: IconServer2,
    metadataSchema: z.object({
      instance: activityInstanceSchema,
    }),
    render: () => "Requested instance deletion",
  },
  instance_power_action_completed: activityType({
    icon: IconServer2,
    metadataSchema: z.object({
      action: instancePowerActionEnum,
      instance: activityInstanceSchema,
    }),
    render: (m) => `Completed instance ${m.action}`,
  }),
  instance_power_action_failed: {
    icon: IconServer2,
    metadataSchema: z.object({
      error: z.string(),
      instance: activityInstanceSchema,
    }),
    render: () => "Failed instance power action",
  },
  instance_power_action_requested: activityType({
    icon: IconServer2,
    metadataSchema: z.object({
      action: instancePowerActionEnum,
      instance: activityInstanceSchema,
    }),
    render: (m) => `Requested instance ${m.action}`,
  }),
  instance_provision_requested: {
    icon: IconServer2,
    metadataSchema: z.object({
      instance: activityInstanceSchema,
    }),
    render: () => "Requested instance provisioning",
  },
  instance_provisioning_failed: {
    icon: IconServer2,
    metadataSchema: z.object({
      error: z.string(),
      instance: activityInstanceSchema,
    }),
    render: () => "Instance provisioning failed",
  },
  instance_updated: {
    icon: IconServer2,
    metadataSchema: z.object({}),
    render: () => "Updated instance",
  },
  ssh_key_created: {
    icon: IconKey,
    metadataSchema: z.object({}),
    render: () => "Created SSH key",
  },
  ssh_key_deleted: {
    icon: IconKey,
    metadataSchema: z.object({}),
    render: () => "Deleted SSH key",
  },
  ssh_key_updated: {
    icon: IconKey,
    metadataSchema: z.object({}),
    render: () => "Updated SSH key",
  },
  user_deleted: {
    icon: IconUser,
    metadataSchema: z.object({}),
    render: () => "Deleted user",
  },
  user_logged_in: {
    icon: IconUser,
    metadataSchema: z.object({}),
    render: () => "User logged in",
  },
  user_logged_out: {
    icon: IconUser,
    metadataSchema: z.object({}),
    render: () => "User logged out",
  },
  user_updated: {
    icon: IconUser,
    metadataSchema: z.object({}),
    render: () => "Updated user",
  },
} satisfies Record<string, ActivityTypeConfig<z.ZodType>>

export type ActivityType = keyof typeof activityRegistry

const activityTypeKeys = Object.keys(activityRegistry) as [
  ActivityType,
  ...ActivityType[],
]
export const activityTypeSchema = z.enum(activityTypeKeys)

export const insertActivitySchema = createInsertSchema(activityTable, {
  type: activityTypeSchema,
})
export const selectActivitySchema = createSelectSchema(activityTable, {
  type: activityTypeSchema,
})

export type InsertActivity = z.infer<typeof insertActivitySchema>

export type Activity = z.infer<typeof selectActivitySchema>
export type ActivityReferenceTypeEnum =
  (typeof activityReferenceTypeEnum.enumValues)[number]

export function parseActivityMetadata<T extends ActivityType>(
  type: T,
  metadata: unknown,
) {
  return activityRegistry[type].metadataSchema.parse(metadata) as z.infer<
    (typeof activityRegistry)[T]["metadataSchema"]
  >
}

export function renderActivity(
  item: Pick<Activity, "type" | "metadata">,
): string {
  const config = activityRegistry[item.type] as ActivityTypeConfig<z.ZodType>
  const metadata = config.metadataSchema.parse(item.metadata)
  return config.render(metadata)
}
