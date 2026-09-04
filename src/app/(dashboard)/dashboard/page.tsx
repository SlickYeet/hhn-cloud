import { IconCirclePlus, IconKey, IconServer2 } from "@tabler/icons-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DASHBOARD_INFO_CARDS } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { cn } from "@/lib/utils"
import { Activities } from "@/modules/dashboard/ui/activities"
import { CloudMap } from "@/modules/dashboard/ui/cloud-map"
import { CreateSshKeyModal } from "@/modules/dashboard/ui/create-ssh-key-modal"
import { InviteMember } from "@/modules/dashboard/ui/invite-member"
import { OrgResources } from "@/modules/dashboard/ui/org-resources"
import { getSession } from "@/server/auth/utils"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  await api.instance.count.prefetch()
  await api.sshKey.count.prefetch()
  await api.ipAllocation.count.prefetch()
  await api.network.count.prefetch()
  await api.firewallRule.count.prefetch()
  // await api.snapshot.count.prefetch()
  // await api.apiKey.count.prefetch()
  await api.organization.member.count.prefetch()

  return (
    <main className="mx-auto size-full max-w-384 px-4 pb-6 sm:px-6">
      <div className="flex justify-between gap-6 py-6 text-primary-foreground max-sm:flex-col">
        <div className="flex items-center gap-2">
          <Avatar
            className="rounded-sm after:rounded-[inherit] after:border-0"
            size="lg"
          >
            <AvatarFallback className="rounded-md bg-primary-foreground text-primary">
              <IconServer2 className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <p className="font-medium">Welcome back, {session.user.name}</p>
            <p className="text-xs">Compute Dashboard</p>
          </div>
        </div>
        <div>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/instance/create" />}
            size="lg"
            variant="secondary"
          >
            <IconCirclePlus /> New Instance
          </Button>
        </div>
      </div>

      <HydrateClient>
        <div
          className={cn(
            "flex flex-col gap-4 lg:flex-row",
            "[--activities-header-height:--spacing(16)] [--dashboard-0rg-resources-header-height:--spacing(8)] [--dashboard-card-height:calc(100dvh-40dvh)] lg:[--dashboard-card-height:calc(100dvh-55dvh)]",
          )}
        >
          <div className="inline-flex h-(--dashboard-card-height) flex-1 flex-col overflow-y-hidden rounded-t-md lg:flex-row lg:rounded-r-none lg:rounded-l-md">
            <div className="w-full overflow-auto rounded-t-md lg:flex-1 lg:rounded-r-none lg:rounded-l-md">
              <CloudMap />
            </div>
            <OrgResources />
          </div>
          <Activities />
        </div>
      </HydrateClient>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InviteMember />
        <CreateSshKeyModal
          render={
            <Button
              className="h-14 w-full justify-start gap-4 rounded-md bg-gray-50 pl-6 hover:bg-[color-mix(in_oklch,var(--color-gray-50),var(--foreground)_5%)] lg:h-16 dark:bg-card dark:hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]"
              variant="secondary"
            />
          }
        >
          <IconKey className="size-6 stroke-primary" />
          <span className="text-lg">Add SSH Key</span>
        </CreateSshKeyModal>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {DASHBOARD_INFO_CARDS.map((card) => (
          <a
            className="flex h-full flex-col items-start rounded-md bg-gray-50 p-6 hover:bg-[color-mix(in_oklch,var(--color-gray-50),var(--foreground)_5%)] dark:bg-card dark:hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]"
            href={card.link}
            key={card.title}
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="flex items-center gap-2">
              <p className="font-medium text-lg uppercase">{card.title}</p>
            </div>
            <p className="mt-4 text-foreground/95 text-sm">
              {card.description}
            </p>
          </a>
        ))}
      </div>
    </main>
  )
}
