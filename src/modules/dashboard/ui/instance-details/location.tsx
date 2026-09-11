"use client"

import { IconMapPin } from "@tabler/icons-react"

import { Hint } from "@/components/hint"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { CLOUD_LOCATIONS } from "@/constants/app"
import { api } from "@/lib/api/client"
import { CountryMap } from "@/modules/dashboard/ui/country-map"

export function InstanceLocation({ instanceId }: { instanceId: string }) {
  const { data: instance } = api.instance.get.useQuery({ id: instanceId })

  const LOCATION_DETAILS = [
    { description: CLOUD_LOCATIONS.at(0)?.name, title: "Datacenter" },
    { description: instance?.pveNode, title: "Node" },
    {
      description: `🇨🇦 ${CLOUD_LOCATIONS.at(0)?.location.split(",")[1]}`,
      title: "Country",
    },
    { description: CLOUD_LOCATIONS.at(0)?.region, title: "Network Zone" },
  ]

  return (
    <Card className="@container gap-4">
      <CardHeader className="px-8">
        <CardTitle className="flex items-center gap-2">
          <IconMapPin className="size-5 stroke-primary" />
          <p className="text-lg uppercase">Location</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full @md:flex-row flex-col @md:items-center justify-between @md:gap-0 gap-4 px-4">
        <div className="grid flex-2 @md:grid-cols-2 grid-cols-1 gap-4">
          {LOCATION_DETAILS.map((detail) => (
            <Item key={detail.title}>
              <ItemContent>
                <ItemTitle className="font-normal text-muted-foreground text-sm">
                  {detail.title}
                </ItemTitle>
                {detail.description && (
                  <Hint label={detail.description} side="inline-start">
                    <ItemDescription className="line-clamp-1 font-medium text-foreground">
                      {detail.description}
                    </ItemDescription>
                  </Hint>
                )}
              </ItemContent>
            </Item>
          ))}
        </div>
        <div className="@md:inline-flex hidden h-full flex-1 items-center">
          <CountryMap />
        </div>
      </CardContent>
    </Card>
  )
}
