import { IconCirclePlus } from "@tabler/icons-react"
import { noop } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { HydrateClient } from "@/components/providers/hydrate-client"
import { getQueryClient } from "@/components/providers/query-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api } from "@/lib/api/client"
import { CreateInstanceForm } from "@/modules/dashboard/ui/create-instance-form"
import { getSession } from "@/server/auth/utils"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  const organizationId =
    session.session.activeOrganizationId || session.user.defaultOrganizationId

  const queryClient = getQueryClient()
  await queryClient
    .query(
      api.instance.list.queryOptions({
        input: { limit: DEFAULT_PAGE_SIZE, organizationId },
      }),
    )
    .catch(noop)
  await queryClient.query(api.sshKey.list.queryOptions()).catch(noop)
  await queryClient
    .query(api.operatingSystem.category.list.queryOptions())
    .catch(noop)
  await queryClient.query(api.operatingSystem.list.queryOptions()).catch(noop)
  await queryClient.query(api.resourcePlan.list.queryOptions()).catch(noop)

  return (
    <main className="mx-auto size-full max-w-384 px-4 pb-6 sm:px-6">
      <div className="flex justify-between gap-6 py-6 text-primary-foreground max-sm:flex-col">
        <div className="flex items-center gap-2">
          <Avatar
            className="rounded-sm after:rounded-[inherit] after:border-0"
            size="lg"
          >
            <AvatarFallback className="rounded-md bg-primary-foreground text-primary">
              <IconCirclePlus className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <p className="font-medium">New Instance</p>
            <p className="text-xs">Virtualize your infrastructure</p>
          </div>
        </div>
      </div>

      <HydrateClient>
        <CreateInstanceForm organizationId={organizationId} />
      </HydrateClient>
    </main>
  )
}
