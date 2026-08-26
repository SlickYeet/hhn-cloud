import { IconCirclePlus, IconServer2 } from "@tabler/icons-react"
import { redirect } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getSession } from "@/server/auth/utils"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  return (
    <main className="relative z-1 size-full flex-1 before:absolute before:inset-x-0 before:top-0 before:-z-1 before:h-105 before:bg-primary">
      <div className="mx-auto size-full max-w-384 px-4 pb-6 sm:px-6">
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
              <p className="font-medium">Compute Dashboard</p>
              <p className="text-sm">Server instances</p>
            </div>
          </div>
          <div>
            <Button size="lg" variant="secondary">
              <IconCirclePlus />
              New instance
            </Button>
          </div>
        </div>

        <Card>
          <CardContent>
            <p className="text-muted-foreground text-sm">No instances found.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
