"use client"

import { IconCheck, IconCopy } from "@tabler/icons-react"
import { notFound } from "next/navigation"

import { Hint } from "@/components/hint"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { InstanceStatus } from "@/schemas/instance"

export function InstanceDetailsInfo({ instanceId }: { instanceId: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const { data: instance } = api.instance.get.useQuery({ id: instanceId })

  if (!instance) return notFound()

  function getInstanceStatusColor(status: InstanceStatus) {
    switch (status) {
      case "deleted":
      case "deleting":
      case "failed":
        return "bg-destructive"
      case "stopped":
        return "bg-gray-500"
      case "pending_deletion":
      case "restarting":
        return "bg-amber-500"
      case "queued":
        return "bg-primary"
      case "provisioning":
      case "running":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  function getInstanceStatusAnimation(status: InstanceStatus) {
    switch (status) {
      case "deleting":
      case "pending_deletion":
      case "restarting":
      case "provisioning":
      case "queued":
        return "animate-pulse"
      default:
        return ""
    }
  }

  return (
    <div className="mb-4 flex h-16 items-center justify-between">
      <div className="flex items-center gap-4">
        <Hint label={`Instance: ${instance.status}`} side="bottom">
          <div
            className={cn(
              "mt-1 size-3 rounded-full",
              getInstanceStatusColor(instance.status),
              getInstanceStatusAnimation(instance.status),
            )}
          />
        </Hint>
        <h1 className="peer/hostname font-medium text-2xl underline decoration-border decoration-dotted underline-offset-4">
          {instance.hostname}
        </h1>
        <Button
          className="opacity-0 hover:opacity-100 peer-hover/hostname:opacity-100"
          onClick={() => copyToClipboard(instance.hostname)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              copyToClipboard(instance.hostname)
            }
          }}
          size="icon"
          variant="ghost"
        >
          {isCopied ? <IconCheck className="text-green-500" /> : <IconCopy />}
          <span className="sr-only">Copy to clipboard</span>
        </Button>
      </div>
    </div>
  )
}
