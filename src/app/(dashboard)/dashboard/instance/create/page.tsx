import { redirect } from "next/navigation"

import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { CreateInstanceForm } from "@/modules/dashboard/ui/create-instance-form"
import { getSession } from "@/server/auth/utils"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  await api.instance.list.prefetchInfinite({ limit: DEFAULT_PAGE_SIZE })
  await api.sshKey.list.prefetch()
  await api.operatingSystem.category.list.prefetch()
  await api.operatingSystem.list.prefetch()
  await api.resourcePlan.list.prefetch()

  return (
    <HydrateClient>
      <CreateInstanceForm />
    </HydrateClient>
  )
}
