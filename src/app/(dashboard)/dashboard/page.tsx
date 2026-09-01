import { IconCirclePlus, IconServer2 } from "@tabler/icons-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { CloudMap } from "@/components/cloud-map"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { OrgResources } from "@/modules/dashboard/ui/org-resources"
import { getSession } from "@/server/auth/utils"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

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

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="inline-flex flex-1 flex-col overflow-auto rounded-t-md lg:flex-row lg:rounded-r-none lg:rounded-l-md">
          <div className="h-96 w-full overflow-auto rounded-t-md lg:h-120 lg:flex-1 lg:rounded-r-none lg:rounded-l-md">
            <CloudMap />
          </div>
          <OrgResources />
        </div>
        {/* Recent activity */}
      </div>
    </main>
  )
}
