"use client"

import { IconArrowRight } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api } from "@/lib/api/client"

export function InstanceList() {
  const { data: instances } = useQuery(
    api.instance.list.queryOptions({ input: { limit: DEFAULT_PAGE_SIZE } }),
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
          <div className="flex items-center justify-between" key={instance.id}>
            <div className="flex flex-col gap-2">
              <p className="font-medium">{instance.hostname}</p>
              <p className="text-muted-foreground text-sm">
                {instance.cores} cores, {instance.memory} GB RAM,{" "}
                {instance.disk} GB disk
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href={`/dashboard/instance/${instance.id}`} />}
              size="sm"
              variant="link"
            >
              View details <IconArrowRight />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
