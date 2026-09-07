"use client"

import { IconBell, IconChevronRight } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { CircleQuestionMarkIcon } from "lucide-react"
import Link from "next/link"

import { Hint } from "@/components/hint"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, getActivityTypeIcon } from "@/lib/utils"
import type { Activity } from "@/schemas/activity"

interface ActivityCardProps {
  activity?: Activity[]
  className?: string
}

export function ActivityCard({ activity, className }: ActivityCardProps) {
  return (
    <Card className={cn("@container", className)}>
      <CardContent>
        <CardHeader className="mb-4 flex items-center justify-between gap-2 @md:px-4 px-0">
          <CardTitle className="flex items-center gap-2">
            <IconBell className="size-5 stroke-primary" />
            <p className="text-lg uppercase">Activity</p>
          </CardTitle>
          <Button
            className="px-0"
            nativeButton={false}
            render={<Link href="/dashboard" />}
            size="sm"
            variant="link"
          >
            View All <IconChevronRight />
          </Button>
        </CardHeader>
        <ScrollArea className="h-[50dvh] lg:h-[35dvh]">
          <ItemGroup className="gap-y-0">
            {activity?.length ? (
              activity?.map((item) => {
                const Icon = getActivityTypeIcon(item.type)

                return (
                  <Item
                    className="group/activity"
                    key={item.id}
                    render={
                      <Link
                        // @ts-expect-error: cannot use typedRoutes here
                        href={`/dashboard/activity/${item.id}`}
                      />
                    }
                  >
                    <ItemMedia>
                      <Avatar>
                        <AvatarFallback>
                          <Icon className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent className="gap-1">
                      <ItemTitle className="line-clamp-1 font-normal text-base">
                        {item.type
                          .slice(0, 1)
                          .toUpperCase()
                          .concat(item.type.slice(1))
                          .replace(/_/g, " ")}
                      </ItemTitle>
                      <ItemDescription className="line-clamp-2 text-xs">
                        {item.referenceType}
                      </ItemDescription>
                    </ItemContent>
                    <ItemContent className="flex-none shrink-0">
                      <Hint
                        label={item.timestamp.toDateString()}
                        side="left"
                        sideOffset={8}
                      >
                        <ItemDescription className="text-right">
                          {formatDistanceToNow(new Date(item.timestamp), {
                            addSuffix: true,
                          })}
                        </ItemDescription>
                      </Hint>
                      <ItemDescription className="text-right text-foreground/70">
                        {item.actorType === "user" ? (
                          <HoverCard>
                            <HoverCardTrigger
                              closeDelay={100}
                              delay={10}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              render={
                                <Button className="px-0" variant="link" />
                              }
                            >
                              {item.actorType}
                            </HoverCardTrigger>
                            <HoverCardContent
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              {item.metadata && "user" in item.metadata && (
                                <Avatar>
                                  <AvatarImage
                                    alt={
                                      (
                                        item.metadata.user as
                                          | { name?: string }
                                          | undefined
                                      )?.name ?? ""
                                    }
                                    src={
                                      (
                                        item.metadata.user as
                                          | { image?: string }
                                          | undefined
                                      )?.image ?? ""
                                    }
                                  />
                                  <AvatarFallback>
                                    {(
                                      item.metadata.user as
                                        | { name?: string }
                                        | undefined
                                    )?.name?.[0] ?? ""}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          item.actorType
                        )}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                )
              })
            ) : (
              <Item className="@lg:px-4 px-0">
                <ItemMedia variant="icon">
                  <CircleQuestionMarkIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>No activity found.</ItemTitle>
                  <ItemDescription>
                    There is no activity to display for this instance.
                  </ItemDescription>
                </ItemContent>
              </Item>
            )}
          </ItemGroup>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
