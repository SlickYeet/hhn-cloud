"use client"

import { IconCheck, IconCopy } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"

export function InstanceDetailsInfo({ instanceId }: { instanceId: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const { data: instance } = useQuery(
    api.instance.get.queryOptions({ input: { id: instanceId } }),
  )

  if (!instance) return notFound()

  return (
    <div className="mb-4 flex h-16 items-center justify-between">
      <div className="flex items-center">
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
