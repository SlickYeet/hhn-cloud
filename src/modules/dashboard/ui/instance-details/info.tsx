"use client"

import {
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconNetwork,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
  IconPower,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react"
import { GlobeIcon } from "lucide-react"
import { notFound } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Hint } from "@/components/hint"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { Instance, InstanceStatus } from "@/schemas/instance"

const TRANSITIONAL_STATUSES: InstanceStatus[] = [
  "queued",
  "provisioning",
  "starting",
  "stopping",
  "restarting",
  "pending_deletion",
  "deleting",
]

function getInstanceStatusColor(status: InstanceStatus) {
  switch (status) {
    case "deleted":
    case "deleting":
    case "failed":
      return "bg-destructive"
    case "stopped":
      return "bg-gray-500"
    case "stopping":
    case "pending_deletion":
    case "restarting":
      return "bg-amber-500"
    case "queued":
      return "bg-primary"
    case "provisioning":
    case "starting":
    case "running":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

function getInstanceStatusAnimation(status: InstanceStatus) {
  switch (status) {
    case "queued":
    case "provisioning":
    case "restarting":
    case "starting":
    case "stopping":
    case "pending_deletion":
    case "deleting":
      return "animate-pulse"
    default:
      return ""
  }
}

function IPAddress({ ipAddress }: { ipAddress: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const [isRevealed, setIsRevealed] = React.useState(false)

  function handleReveal() {
    if (isRevealed) setIsRevealed(false)
    else setIsRevealed(true)
  }

  const parsedIpAddress = isRevealed
    ? ipAddress
    : ipAddress.replace(/[a-zA-Z0-9]/g, "*")

  return (
    <div className="group/ipAddress flex items-center gap-2">
      <GlobeIcon
        className={cn(
          "size-4 stroke-primary group-hover/ipAddress:hidden",
          isCopied && "hidden",
        )}
      />
      <Button
        className={cn(
          "hidden w-4 group-hover/ipAddress:inline-flex",
          isCopied && "inline-flex",
        )}
        onClick={() => copyToClipboard(ipAddress)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            copyToClipboard(ipAddress)
          }
        }}
        size="icon-sm"
        variant="ghost"
      >
        {isCopied ? <IconCheck className="text-green-500" /> : <IconCopy />}
        <span className="sr-only">Copy to clipboard</span>
      </Button>
      <Button
        className="px-0 active:not-aria-[haspopup]:translate-y-0"
        onClick={handleReveal}
        size="sm"
        variant="ghost"
      >
        <span className="font-mono">{parsedIpAddress}</span>
      </Button>
    </div>
  )
}

function InstanceActions({ instance }: { instance: Instance }) {
  const utils = api.useUtils()
  const { copyToClipboard } = useCopyToClipboard()

  const startMutation = api.instance.start.useMutation({
    onError(error) {
      console.error("Error starting instance:", error)
      toast.error("Failed to start instance.", {
        description: error.message,
      })
    },
    async onSuccess(data) {
      await utils.instance.get.invalidate({ id: data.id })
    },
  })
  const restartMutation = api.instance.restart.useMutation({
    onError(error) {
      console.error("Error restarting instance:", error)
      toast.error("Failed to restart instance.", {
        description: error.message,
      })
    },
    async onSuccess(data) {
      await utils.instance.get.invalidate({ id: data.id })
    },
  })
  const shutdownMutation = api.instance.shutdown.useMutation({
    onError(error) {
      console.error("Error shutting down instance:", error)
      toast.error("Failed to shut down instance.", {
        description: error.message,
      })
    },
    async onSuccess(data) {
      await utils.instance.get.invalidate({ id: data.id })
    },
  })
  const stopMutation = api.instance.stop.useMutation({
    onError(error) {
      console.error("Error stopping instance:", error)
      toast.error("Failed to stop instance.", {
        description: error.message,
      })
    },
    async onSuccess(data) {
      await utils.instance.get.invalidate({ id: data.id })
    },
  })
  const deleteMutation = api.instance.delete.useMutation({
    onError(error) {
      console.error("Error deleting instance:", error)
      toast.error("Failed to delete instance.", {
        description: error.message,
      })
    },
    async onSuccess(data) {
      await utils.instance.get.invalidate({ id: data.instanceId })
      await utils.instance.list.invalidate()
    },
  })

  const isTransitionalStatus = TRANSITIONAL_STATUSES.includes(instance.status)
  if (isTransitionalStatus) {
    return (
      <Button disabled size="sm" variant="outline">
        Actions <IconChevronDown />
      </Button>
    )
  }

  function isDisabled(action: "start" | "restart" | "shutdown" | "stop") {
    switch (action) {
      case "start":
        return instance.status !== "stopped"
      case "restart":
        return instance.status !== "running"
      case "shutdown":
        return instance.status !== "running"
      case "stop":
        return instance.status !== "running"
      default:
        return true
    }
  }

  const isDeletable =
    instance.status !== "pending_deletion" &&
    instance.status !== "deleting" &&
    instance.status !== "deleted"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
        Actions <IconChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Power Actions</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={isDisabled("start")}
            onClick={() => startMutation.mutate({ id: instance.id })}
          >
            <IconPlayerPlayFilled /> Start
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isDisabled("restart")}
            onClick={() => restartMutation.mutate({ id: instance.id })}
          >
            <IconRefresh /> Restart
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isDisabled("shutdown")}
            onClick={() => shutdownMutation.mutate({ id: instance.id })}
          >
            <IconPower /> Shutdown
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isDisabled("stop")}
            onClick={() => stopMutation.mutate({ id: instance.id })}
            variant="destructive"
          >
            <IconPlayerStopFilled /> Stop
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Instance Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => copyToClipboard(instance.id)}>
            <IconCopy /> Copy ID
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isDeletable}
            onClick={() => deleteMutation.mutate({ id: instance.id })}
            variant="destructive"
          >
            <IconTrash /> Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function InstanceDetailsInfo({ instanceId }: { instanceId: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const { data: instance } = api.instance.get.useQuery(
    { id: instanceId },
    {
      refetchInterval(query) {
        const status = query.state.data?.status
        if (!status) return false
        return TRANSITIONAL_STATUSES.includes(status) ? 2000 : false
      },
    },
  )

  if (!instance) return notFound()

  return (
    <div className="mb-4 flex h-auto flex-col gap-4 md:h-16 md:flex-row md:items-center md:justify-between md:gap-0">
      <div className="flex flex-col items-start gap-1">
        <div className="ml-0.5 flex items-center gap-4">
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
            className="w-auto opacity-0 hover:opacity-100 peer-hover/hostname:opacity-100"
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
        <ScrollArea className="w-full">
          <div className="flex items-center gap-5">
            {instance.ipAllocations.map((allocation) => (
              <IPAddress ipAddress={allocation.ipAddress} key={allocation.id} />
            ))}
            <Button
              className="gap-1.5 px-0"
              // TODO
              onClick={() => alert("Coming soon!")}
              size="sm"
              variant="link"
            >
              <IconNetwork /> Add Floating IP
            </Button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <InstanceActions instance={instance} />
    </div>
  )
}
