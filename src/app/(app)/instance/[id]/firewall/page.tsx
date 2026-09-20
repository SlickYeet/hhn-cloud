import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { api, HydrateClient } from "@/lib/api/server"
import { InstanceFirewallConfigurator } from "@/modules/dashboard/ui/instance-firewall/configurator"

export async function generateMetadata({
  params,
}: PageProps<"/instance/[id]/firewall">): Promise<Metadata> {
  const { id: instanceId } = await params
  const instance = await api.instance.get({ id: instanceId })
  if (!instance) return notFound()
  return {
    title: `${instance.hostname} Firewall`,
  }
}

export default async function Page({
  params,
}: PageProps<"/instance/[id]/firewall">) {
  const { id: instanceId } = await params

  if (!instanceId) return notFound()

  await api.firewallRule.list.prefetch({ instanceId })
  await api.instance.firewallStatus.prefetch({ instanceId })

  return (
    <HydrateClient>
      <Card>
        <CardContent>
          <InstanceFirewallConfigurator instanceId={instanceId} />
        </CardContent>
      </Card>
    </HydrateClient>
  )
}
