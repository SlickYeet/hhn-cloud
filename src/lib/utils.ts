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
import type { ResourcePlan } from "@/schemas/resource-plan"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return env.NEXT_PUBLIC_URL
}

export function getResourcePlanIcon(planId: ResourcePlan["id"]) {
  switch (planId) {
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
    case "2xlarge":
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
