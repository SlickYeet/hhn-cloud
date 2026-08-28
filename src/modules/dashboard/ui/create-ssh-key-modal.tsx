"use client"

import { IconCirclePlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

interface CreateSshKeyModalProps {
  disabled?: boolean
}

export function CreateSshKeyModal({
  disabled = false,
}: CreateSshKeyModalProps) {
  return (
    <Button
      className="shrink-0"
      // disabled={disabled}
      disabled
      type="button"
      variant="outline"
    >
      <IconCirclePlus />
    </Button>
  )
}
