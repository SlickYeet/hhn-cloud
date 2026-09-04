"use client"

import { IconUser } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

export function InviteMember() {
  return (
    <Button
      className="h-14 w-full justify-start gap-4 rounded-md bg-gray-50 pl-6 hover:bg-[color-mix(in_oklch,var(--color-gray-50),var(--foreground)_5%)] lg:h-16 dark:bg-card dark:hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]"
      // TODO
      onClick={() => alert("Coming soon!")}
      variant="secondary"
    >
      <IconUser className="size-6 stroke-primary" />
      <span className="text-lg">Invite Member</span>
    </Button>
  )
}
