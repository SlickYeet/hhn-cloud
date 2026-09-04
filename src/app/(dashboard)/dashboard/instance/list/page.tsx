import { IconServer2 } from "@tabler/icons-react"
import { redirect } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { InstanceList } from "@/modules/dashboard/ui/instance-list"
import { getSession } from "@/server/auth/utils"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  await api.instance.list.prefetch({ limit: DEFAULT_PAGE_SIZE })

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
            <p className="font-medium"></p>
            <p className="text-xs">Your virtual infrastructure</p>
          </div>
        </div>
      </div>

      <HydrateClient>
        <InstanceList />
      </HydrateClient>
    </main>
  )
}
