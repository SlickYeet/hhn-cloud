"use client"

import { IconBell, IconChevronRight } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { BellIcon, CircleQuestionMarkIcon } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api/client"

interface ActivityCardProps {
  instanceId: string
}

// TODO: refactor this to be used as the Activities component on the dashboard
export function ActivityCard({ instanceId }: ActivityCardProps) {
  const { data: activity } = api.instance.getActivity.useQuery({
    id: instanceId,
  })

  return (
    <Card>
      <CardContent>
        <CardHeader className="mb-4 flex items-center justify-between gap-2">
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
        <ScrollArea className="h-[50dvh] lg:h-[25dvh]">
          <ItemGroup>
            {activity ? (
              activity?.map((item, idx) => (
                <Item
                  key={idx}
                  render={
                    <Link
                      // @ts-expect-error: cannot use typedRoutes here
                      href={`/dashboard/instances/${instanceId}/activity/${idx}`}
                    />
                  }
                >
                  <ItemMedia>
                    <Avatar>
                      <AvatarFallback>
                        {/* TODO: Replace with appropriate icon */}
                        <BellIcon className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className="gap-1">
                    <ItemTitle className="line-clamp-1 font-normal text-base">
                      {item.title}
                    </ItemTitle>
                    <ItemDescription className="line-clamp-2 text-xs">
                      {item.description}
                    </ItemDescription>
                  </ItemContent>
                  <ItemContent className="flex-none shrink-0">
                    <ItemDescription className="text-right">
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                      })}
                    </ItemDescription>
                    {item.origin && (
                      <ItemDescription className="text-right text-foreground/70">
                        {item.origin}
                      </ItemDescription>
                    )}
                  </ItemContent>
                </Item>
              ))
            ) : (
              <Item>
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
