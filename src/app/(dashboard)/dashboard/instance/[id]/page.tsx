import { notFound } from "next/navigation"

import { Tabs } from "@/components/ui/tabs"
import { api, HydrateClient } from "@/lib/api/server"
import { InstanceActivity } from "@/modules/dashboard/ui/instance-details/activity"
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

          <div className="mx-auto mt-4 flex size-full max-w-384 flex-col gap-4 px-4 sm:px-6">
            <InstanceResources instanceId={instanceId} />
            <div className="md: grid grid-cols-1 gap-4 md:grid-cols-2">
              <InstanceActivity instanceId={instanceId} />
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
