"use client"

import {
  IconCirclePlus,
  IconLogout,
  IconSettings,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth/client"
import type { User } from "@/server/db/schema"

export function UserMenu({ user }: { user: User }) {
  async function handleSignOut() {
    await authClient.signOut()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2">
        <Avatar>
          <AvatarImage alt={user.name} src={user.image || ""} />
          <AvatarFallback>{user.name.at(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start gap-0.5 sm:flex">
          <span className="font-medium text-sm">{user.name}</span>
          <span className="text-muted-foreground text-xs capitalize">
            {user.role}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" side="bottom">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-4 px-4 py-2.5 font-normal">
            <div className="relative">
              <Avatar size="lg">
                <AvatarImage alt={user.name} src={user.image || ""} />
                <AvatarFallback>
                  {user.name.at(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute right-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2 ring-card" />
            </div>
            <div className="flex flex-1 flex-col items-start">
              <span className="font-semibold text-foreground text-lg">
                {user.name}
              </span>
              <span className="text-base text-muted-foreground">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconUser />
            <span>My account</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconSettings />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconUsers />
            <span>Organization</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconCirclePlus />
            <span>Add member</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSignOut} variant="destructive">
            <IconLogout />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
