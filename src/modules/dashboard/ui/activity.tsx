"use client"

import { IconBell, IconChevronRight } from "@tabler/icons-react"
import { formatDate, formatDistanceToNowStrict } from "date-fns"
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
import { Separator } from "@/components/ui/separator"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import type { RouterInputs } from "@/lib/api/client"
import { api } from "@/lib/api/client"
import { cn, getActivityTypeIcon } from "@/lib/utils"

interface ActivityCardProps {
  scope: RouterInputs["activity"]["list"]["scope"]
  instanceId?: string
  className?: string
}

export function ActivityCard({
  scope,
  instanceId,
  className,
}: ActivityCardProps) {
  // TODO: infinite scroll
  const { data: activity } = api.activity.list.useQuery(
    {
      instanceId,
      limit: DEFAULT_PAGE_SIZE,
      scope,
    },
    {
      refetchInterval: 10000,
    },
  )

  return (
    <Card className={cn("@container", className)}>
      <CardContent>
        <CardHeader className="flex items-center justify-between gap-2 @md:px-4 px-0">
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
        <Separator className="my-2" />
        <ScrollArea className="-mx-4 h-[50dvh] lg:h-[35dvh]">
          <ItemGroup className="gap-y-0!">
            {activity?.length ? (
              activity?.map((item) => {
                const Icon = getActivityTypeIcon(item.type)

                return (
                  <Item
                    className="group/activity flex-row items-start @lg:px-4 px-1"
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
                    <ItemContent>
                      <Hint
                        align="start"
                        label={item.type}
                        side="top"
                        sideOffset={8}
                      >
                        <ItemTitle className="line-clamp-1 text-left font-normal text-base">
                          {item.type.replace(/_/g, " ")}
                        </ItemTitle>
                      </Hint>
                      <ItemDescription className="line-clamp-2 text-xs capitalize">
                        {item.referenceType}{" "}
                        {typeof item.metadata?.action === "string" ? (
                          <span>- {item.metadata.action}</span>
                        ) : null}
                      </ItemDescription>
                    </ItemContent>
                    <ItemContent className="flex-none shrink-0">
                      <Hint
                        label={formatDate(new Date(item.timestamp), "PPpp")}
                        side="top"
                        sideOffset={8}
                      >
                        <ItemDescription className="truncate text-right">
                          {formatDistanceToNowStrict(new Date(item.timestamp), {
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
                            {item.metadata && "user" in item.metadata && (
                              <HoverCardContent
                                className="flex flex-row items-center gap-3"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
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
                                <div className="flex w-full flex-col">
                                  <div className="flex flex-row items-center gap-2">
                                    <span className="text-sm">
                                      {(
                                        item.metadata.user as
                                          | { name?: string }
                                          | undefined
                                      )?.name ?? "Unknown User"}
                                    </span>
                                    <span className="text-foreground/70 text-xs capitalize">
                                      (
                                      {(
                                        item.metadata.user as
                                          | { role?: string }
                                          | undefined
                                      )?.role ?? "Unknown Role"}
                                      )
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground text-sm">
                                    {(
                                      item.metadata.user as
                                        | { email?: string }
                                        | undefined
                                    )?.email ?? "No email available"}
                                  </span>
                                </div>
                              </HoverCardContent>
                            )}
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
