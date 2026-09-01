import { IconBell, IconChevronRight } from "@tabler/icons-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function Activities() {
  return (
    <div className="h-(--dashboard-card-height) w-full self-start rounded-md bg-gray-50 lg:max-w-80 dark:bg-card">
      <div className="flex h-(--activities-header-height) items-center justify-between rounded-b-none border-b bg-muted px-4 py-2 lg:rounded-tl-none lg:rounded-tr-md">
        <div className="flex items-center gap-2">
          <IconBell className="size-5 stroke-primary" />
          <p className="text-lg uppercase">Activity</p>
        </div>
        <Button
          className="px-0"
          nativeButton={false}
          render={<Link href="/dashboard" />}
          size="sm"
          variant="link"
        >
          View All <IconChevronRight />
        </Button>
      </div>
      <ScrollArea className="h-[calc(var(--dashboard-card-height)-var(--activities-header-height))] w-full rounded-b-md">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            className="flex items-center justify-between gap-2 border-b px-4 py-2 last:border-b-0 hover:bg-[color-mix(in_oklch,var(--color-gray-50),var(--foreground)_5%)] dark:hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]"
            key={index}
          >
            <div className="flex flex-col">
              <p className="line-clamp-1 font-medium text-sm">
                Activity {index + 1}
              </p>
              <p className="line-clamp-1 text-muted-foreground text-xs">
                Description of activity {index + 1}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="shrink-0 whitespace-nowrap text-muted-foreground text-xs">
                Timestamp
              </p>
              <p className="text-foreground/70 text-xs">origin</p>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}
