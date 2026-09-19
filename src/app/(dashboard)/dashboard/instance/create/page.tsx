import type { Metadata } from "next"

import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { CreateInstanceForm } from "@/modules/dashboard/ui/create-instance-form"
import { requireSession } from "@/server/auth/utils"

export const metadata: Metadata = {
  description: "Create a new virtual machine",
  title: "Create Instance",
}

export default async function Page() {
  await requireSession()

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
