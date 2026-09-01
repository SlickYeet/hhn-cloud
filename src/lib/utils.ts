import {
  IconBrandDebian,
  IconBrandUbuntu,
  IconBrandWindows,
  IconSquare,
  IconStack,
  IconStack2,
  IconStack2Filled,
  IconStack3,
  IconStack3Filled,
  IconStackFilled,
} from "@tabler/icons-react"
import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import { Icons } from "@/components/icons"
import { env } from "@/env"
import type { OperatingSystem } from "@/schemas/operatingSystem"
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
      return IconStack
  }
}

export function getOperatingSystemCategoryIcon(category: string | undefined) {
  switch (category?.toLowerCase()) {
    case "linux":
      return Icons.linux
    case "windows":
      return Icons.windows
    default:
      return IconSquare
  }
}

export function getOperatingSystemIcon(os: string | undefined) {
  switch (os?.toLowerCase()) {
    case "ubuntu":
      return IconBrandUbuntu
    case "debian":
      return IconBrandDebian
    case "centos":
      // TODO
      return IconSquare
    case "fedora":
      // TODO
      return IconSquare
    case "windows":
      return IconBrandWindows
    default:
      return IconSquare
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
