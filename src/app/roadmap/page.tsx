"use client"

import Image from "next/image"
import Link from "next/link"
import * as React from "react"

import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { APP_NAME } from "@/constants/app"
import type { RoadmapCategory } from "@/data/roadmap"
import { roadmap } from "@/data/roadmap"
import { cn } from "@/lib/utils"

type ItemStatus = RoadmapCategory["items"][0]["status"]

export default function Page() {
  const [isDragging, setIsDragging] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef({ isDragging: false, scrollLeft: 0, startX: 0 })

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const element = scrollRef.current
    const target = event.target as HTMLElement

    if (
      !element ||
      target.closest("[data-roadmap-card], [data-roadmap-item]")
    ) {
      return
    }

    event.preventDefault()
    setIsDragging(true)
    dragRef.current = {
      isDragging: true,
      scrollLeft: element.scrollLeft,
      startX: event.clientX,
    }
    element.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = scrollRef.current
    const drag = dragRef.current
    if (!element || !drag.isDragging) return

    element.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX)
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current.isDragging = false
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div className="group/backdrop relative isolate grid h-svh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-30 scale-105">
        <Image
          alt=""
          className="size-full object-cover opacity-90 blur-[7px] saturate-[0.3] dark:hidden"
          height={1080}
          src="/images/dashboards-1.webp"
          width={19220}
        />
        <Image
          alt=""
          className="hidden size-full object-cover opacity-90 blur-[7px] saturate-[0.3] dark:block"
          height={1080}
          src="/images/dashboards-1-dark.webp"
          width={19220}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-muted/75 dark:bg-background/80"
      />
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          href="/"
        >
          <Icons.logo className="size-6" />
          <span className="font-semibold text-base tracking-tight">
            {APP_NAME}
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto grid max-w-360 grid-rows-[auto_minmax(0,1fr)] overflow-hidden px-4 pt-4">
        <div className="mb-8 text-left">
          <h1 className="mb-2 font-bold text-4xl tracking-tight">Roadmap</h1>
          <p className="text-muted-foreground">
            Things that have shipped and stuff in the works.
          </p>
        </div>
        <div
          className={cn(
            "overflow-x-auto overflow-y-hidden",
            isDragging && "select-none",
          )}
          onPointerCancel={stopDragging}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          ref={scrollRef}
        >
          <div className="grid h-full auto-cols-max grid-flow-col items-start gap-4 pb-4 lg:gap-8">
            {roadmap.map((cat) => (
              <div
                className="flex max-h-[calc(100%-1rem)] min-h-0 w-[min(24rem,calc(100dvw-2rem))] flex-col rounded-xl border bg-card p-6 shadow-sm backdrop-blur-sm"
                data-roadmap-card
                key={cat.category}
              >
                <h2 className="mb-6 flex items-center justify-between border-b pb-3 font-semibold text-xl">
                  {cat.category}
                  <Badge className="px-1.5" variant="secondary">
                    {cat.items.length}
                  </Badge>
                </h2>

                <div className="-mr-4 flex-1 overflow-y-auto overflow-x-hidden">
                  <ul className="space-y-4 pr-4">
                    {cat.items.map((item, idx) => (
                      <li
                        className="group relative flex flex-col rounded-lg border border-muted/50 bg-input/30 p-3 shadow-sm transition-colors hover:border-muted dark:bg-muted"
                        data-roadmap-item
                        key={idx}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={cn(
                              "font-medium text-sm leading-relaxed",
                              item.status === "completed"
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {item.title.split("`").map((text, i) =>
                              i % 2 === 1 ? (
                                <code
                                  className="-mx-1 rounded bg-muted px-1.5 py-0.5 font-bold font-mono text-xs dark:bg-input/30"
                                  key={i}
                                >
                                  {text}
                                </code>
                              ) : (
                                text
                              ),
                            )}
                          </span>
                          <StatusBadge status={item.status as ItemStatus} />
                        </div>

                        {item.note && (
                          <p className="mt-2 rounded border border-dashed bg-muted p-2 text-foreground/70 text-xs italic dark:bg-background/75">
                            {item.note}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: ItemStatus }) {
  const variant: Record<ItemStatus, string> = {
    completed: badgeVariants({ variant: "success" }),
    "in-progress": badgeVariants({ variant: "warning" }),
    todo: badgeVariants({ variant: "outline" }),
  }

  const labels: Record<ItemStatus, string> = {
    completed: "Done",
    "in-progress": "In Progress",
    todo: "Backlog",
  }

  return <Badge className={variant[status]}>{labels[status]}</Badge>
}
