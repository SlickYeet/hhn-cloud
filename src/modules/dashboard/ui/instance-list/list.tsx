"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api } from "@/lib/api/client"

import { columns } from "./columns"
import { InstanceTable } from "./table"

export function InstanceList() {
  const [instances, query] = api.instance.list.useSuspenseInfiniteQuery(
    { limit: DEFAULT_PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  )

  if (!instances.pages.at(0)?.items.length) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">No instances found.</p>
        </CardContent>
      </Card>
    )
  }

  const instanceData = instances.pages.flatMap((page) => page.items)

  return (
    <Card>
      <CardContent>
        <InstanceTable
          columns={columns}
          data={instanceData}
          fetchNextPage={query.fetchNextPage}
          hasNextPage={query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
        />
      </CardContent>
    </Card>
  )
}
