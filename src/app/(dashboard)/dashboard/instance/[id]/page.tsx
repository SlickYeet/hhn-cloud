import { noop } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { HydrateClient } from "@/components/providers/hydrate-client"
import { getQueryClient } from "@/components/providers/query-client"
import { Tabs } from "@/components/ui/tabs"
import { api } from "@/lib/api/client"
import { InstanceDetailsInfo } from "@/modules/dashboard/ui/instance-details/info"
import { InstanceDetailsTabs } from "@/modules/dashboard/ui/instance-details/tabs"

export default async function Page({
  params,
}: PageProps<"/dashboard/instance/[id]">) {
  const { id: instanceId } = await params

  if (!instanceId) return notFound()

  const queryClient = getQueryClient()
  await queryClient
    .query(api.instance.get.queryOptions({ input: { id: instanceId } }))
    .catch(noop)

  return (
    <main className="bg-background">
      <HydrateClient>
        <Tabs className="w-full" defaultValue="overview">
          <div className="bg-secondary">
            <div className="mx-auto size-full max-w-384 px-4 pt-4 sm:px-6">
              <InstanceDetailsInfo instanceId={instanceId} />
              <InstanceDetailsTabs instanceId={instanceId} />
            </div>
          </div>

          <div className="mx-auto size-full max-w-384 px-4 py-4 sm:px-6">
            <p>Instance details for instance with ID: {instanceId}</p>
          </div>
        </Tabs>
      </HydrateClient>
    </main>
  )
}
