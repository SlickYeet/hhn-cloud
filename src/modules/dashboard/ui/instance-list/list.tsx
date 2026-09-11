"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api } from "@/lib/api/client"

import { columns } from "./columns"
import { InstanceTable } from "./table"

export function InstanceList() {
  const { data: instances } = api.instance.list.useQuery({
    limit: DEFAULT_PAGE_SIZE,
  })

  if (!instances || instances.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">No instances found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <InstanceTable columns={columns} data={instances} />
      </CardContent>
    </Card>
  )
}
