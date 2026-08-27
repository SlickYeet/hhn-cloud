"use client"

import { useQuery } from "@tanstack/react-query"

import { Card, CardContent } from "@/components/ui/card"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api } from "@/lib/api/client"

export function InstanceList({ organizationId }: { organizationId: string }) {
  const { data: instances } = useQuery(
    api.instance.list.queryOptions({
      input: { limit: DEFAULT_PAGE_SIZE, organizationId },
    }),
  )

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
        {instances.map((instance) => (
          <div className="flex flex-col gap-2" key={instance.id}>
            <p className="font-medium">{instance.hostname}</p>
            <p className="text-muted-foreground text-sm">
              {instance.cores} cores, {instance.memory} GB RAM, {instance.disk}{" "}
              GB disk
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
