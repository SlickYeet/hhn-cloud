import {
  IconKey,
  IconQuestionMark,
  IconServer2,
  IconStack,
  IconStack2,
  IconStack2Filled,
  IconStack3,
  IconStack3Filled,
  IconStackFilled,
  IconUser,
} from "@tabler/icons-react"
import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import { Icons } from "@/components/icons"
import { env } from "@/env"
import type { ActivityTypeEnum } from "@/schemas/activity"
import type {
  OperatingSystem,
  OperatingSystemCategoryEnum,
  OperatingSystemFamilyEnum,
} from "@/schemas/operatingSystem"
import type { ResourcePlan } from "@/schemas/resource-plan"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return env.NEXT_PUBLIC_URL
}

export function getApiVersion() {
  return env.NEXT_PUBLIC_API_VERSION.at(0)
}

export function getResourcePlanIcon(
  planSlug: ResourcePlan["slug"] | undefined,
) {
  switch (planSlug) {
    case "micro":
      return IconStack
    case "small":
      return IconStackFilled
    case "medium":
      return IconStack2
    case "large":
      return IconStack2Filled
    case "xlarge":
      return IconStack3
    case "2x-large":
      return IconStack3Filled
    default:
      return IconQuestionMark
  }
}

export function getOperatingSystemCategoryIcon(
  category: OperatingSystemCategoryEnum | undefined,
) {
  switch (category) {
    case "linux":
      return Icons.linux
    case "windows":
      return Icons.windows
    default:
      return IconQuestionMark
  }
}

export function getOperatingSystemFamilyIcon(
  os: OperatingSystemFamilyEnum | undefined,
) {
  switch (os) {
    case "ubuntu":
      return Icons.ubuntu
    case "debian":
      return Icons.debian
    case "centos":
      return Icons.centOS
    case "fedora":
      return Icons.fedoraLinux
    case "windows":
      return Icons.windows
    case "windows server":
      return Icons.windows
    default:
      return IconQuestionMark
  }
}

export function getOperatingSystemStatusColor(
  status: OperatingSystem["status"],
) {
  switch (status) {
    case "active":
      return "border-l-green-500/50 text-green-500"
    case "inactive":
      return "border-l-yellow-500/50 text-yellow-500"
    case "deprecated":
      return "border-l-destructive/50 text-destructive"
    default:
      return "border-gray-500 text-gray-500"
  }
}

export function getResourcePlanStatusColor(status: ResourcePlan["status"]) {
  switch (status) {
    case "active":
      return "border-l-green-500/50 text-green-500"
    case "inactive":
      return "border-l-yellow-500/50 text-yellow-500"
    case "deprecated":
      return "border-l-destructive/50 text-destructive"
    default:
      return "border-gray-500 text-gray-500"
  }
}

export function getActivityTypeIcon(type: ActivityTypeEnum) {
  switch (type) {
    case "instance_created":
    case "instance_deleted":
    case "instance_provisioning":
    case "instance_provisioning_failed":
    case "instance_started":
    case "instance_stopped":
    case "instance_updated":
      return IconServer2
    case "ssh_key_created":
    case "ssh_key_deleted":
    case "ssh_key_updated":
      return IconKey
    case "user_deleted":
    case "user_logged_in":
    case "user_logged_out":
    case "user_updated":
      return IconUser
    default:
      return IconQuestionMark
  }
}
