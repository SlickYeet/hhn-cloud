import { notFound } from "next/navigation"

import { Tabs } from "@/components/ui/tabs"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { ActivityCard } from "@/modules/dashboard/ui/activity"
import { InstanceDetailsInfo } from "@/modules/dashboard/ui/instance-details/info"
import { InstanceLocation } from "@/modules/dashboard/ui/instance-details/location"
import { InstanceOptions } from "@/modules/dashboard/ui/instance-details/options"
import { InstanceResources } from "@/modules/dashboard/ui/instance-details/resources"
import { InstanceDetailsTabs } from "@/modules/dashboard/ui/instance-details/tabs"

export default async function Page({
  params,
}: PageProps<"/dashboard/instance/[id]">) {
  const { id: instanceId } = await params

  if (!instanceId) return notFound()

  await api.instance.get.prefetch({ id: instanceId })
  await api.activity.list.prefetch({
    instanceId,
    limit: DEFAULT_PAGE_SIZE,
    scope: "instance",
  })

  return (
    <main className="flex flex-col gap-4 bg-background">
      <HydrateClient>
        <Tabs className="w-full" defaultValue="overview">
          <div className="bg-secondary">
            <div className="mx-auto size-full max-w-384 px-4 pt-4 sm:px-6">
              <InstanceDetailsInfo instanceId={instanceId} />
              <InstanceDetailsTabs instanceId={instanceId} />
            </div>
          </div>

          <div className="mx-auto mt-4 flex size-full max-w-384 flex-col gap-6 px-4 sm:px-6">
            <InstanceResources instanceId={instanceId} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ActivityCard instanceId={instanceId} scope="instance" />
              <div className="flex flex-col gap-4">
                <InstanceOptions instanceId={instanceId} />
                <InstanceLocation instanceId={instanceId} />
              </div>
            </div>
          </div>
        </Tabs>
      </HydrateClient>
    </main>
  )
}
