import { IconCirclePlus, IconServer2 } from "@tabler/icons-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MapComponent } from "@/components/ui/map"
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

      {/* Content */}
      <div className="h-105 w-full">
        <MapComponent center={[-74.006, 40.7128]} zoom={12} />
      </div>
    </main>
  )
}
