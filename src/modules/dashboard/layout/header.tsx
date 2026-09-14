"use client"

import { IconActivity, IconBell } from "@tabler/icons-react"
import { PanelLeftCloseIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"
import { APP_NAME } from "@/constants/app"
import { getDashboardWelcomeMessage } from "@/lib/utils"
import type { Session } from "@/server/auth/utils"

export function DashboardHeader({ session }: { session: Session }) {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="text-primary-foreground">
      <div className="mx-auto flex w-full items-center justify-between gap-6 px-4 max-md:gap-1.5 sm:px-6">
        <div className="flex items-center gap-4">
          <Button
            className="size-10 border-primary-foreground! bg-primary-foreground! text-primary! shadow-none outline-none hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
            onClick={toggleSidebar}
          >
            <PanelLeftCloseIcon className="size-5" />
          </Button>
          <div className="hidden sm:flex sm:flex-col sm:items-start">
            <p className="font-semibold text-lg">
              {getDashboardWelcomeMessage()}, {session.user.name}
            </p>
            <p className="text-primary-foreground/80 md:max-lg:hidden">
              {APP_NAME} Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="icon" variant="ghost">
            <IconActivity className="size-5" />
          </Button>
          <Button className="relative" size="icon" variant="ghost">
            <IconBell className="size-5" />
            <span className="absolute top-[14%] right-[23%] size-2 rounded-full bg-destructive" />
          </Button>
          <UserMenu user={session.user} />
        </div>
      </div>
    </header>
  )
}
