import { notFound } from "next/navigation"

import { api, HydrateClient } from "@/lib/api/server"
import { InstanceFirewallConfigurator } from "@/modules/dashboard/ui/instance-firewall/configurator"

export default async function Page({
  params,
}: PageProps<"/dashboard/instance/[id]/firewall">) {
  const { id: instanceId } = await params

  if (!instanceId) return notFound()

  await api.firewallRule.list.prefetch({ instanceId })
  await api.instance.firewallStatus.prefetch({ instanceId })

  return (
    <HydrateClient>
      <div className="mx-auto mt-4 flex h-screen w-full max-w-384 flex-col gap-6 px-4 sm:px-6">
        <InstanceFirewallConfigurator instanceId={instanceId} />
      </div>
    </HydrateClient>
  )
}
