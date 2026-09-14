import { IconCirclePlus } from "@tabler/icons-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { InstanceList } from "@/modules/dashboard/ui/instance-list/list"
import { getSession } from "@/server/auth/utils"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  await api.instance.list.prefetchInfinite({ limit: DEFAULT_PAGE_SIZE })

  return (
    <>
      <div className="mb-6 flex">
        <Button
          className="ml-auto"
          nativeButton={false}
          render={<Link href="/dashboard/instance/create" />}
          size="lg"
          variant="secondary"
        >
          <IconCirclePlus /> New Instance
        </Button>
      </div>

      <HydrateClient>
        <InstanceList />
      </HydrateClient>
    </>
  )
}
