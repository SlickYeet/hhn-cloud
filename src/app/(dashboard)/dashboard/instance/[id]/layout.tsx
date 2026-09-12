import { notFound } from "next/navigation"

import { api, HydrateClient } from "@/lib/api/server"
import { InstanceDetailsInfo } from "@/modules/dashboard/ui/instance-details/info"
import { InstanceDetailsTabs } from "@/modules/dashboard/ui/instance-details/tabs"

export default async function Layout({
  children,
  params,
}: LayoutProps<"/dashboard/instance/[id]">) {
  const { id: instanceId } = await params

  if (!instanceId) return notFound()

  await api.instance.get.prefetch({ id: instanceId })

  return (
    <main className="flex flex-col gap-4 bg-background pb-6">
      <div className="bg-secondary">
        <div className="mx-auto size-full max-w-384 px-4 pt-2 sm:px-6">
          <HydrateClient>
            <InstanceDetailsInfo instanceId={instanceId} />
            <InstanceDetailsTabs instanceId={instanceId} />
          </HydrateClient>
        </div>
      </div>
      {children}
    </main>
  )
}
