"use client"

import {
  IconActivity,
  IconBell,
  IconChartBar,
  IconHome,
  IconMenu,
  IconServer2,
} from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { UserMenu } from "@/components/user-menu"
import { APP_NAME } from "@/constants/app"
import type { Session } from "@/server/auth/utils"

export function DashboardHeader({ session }: { session: Session }) {
  const pathname = usePathname()

  const NAV_ITEMS = [
    { href: "/dashboard", icon: IconChartBar, label: "Dashboard" },
    { href: "/dashboard/instances", icon: IconServer2, label: "Instances" },
  ]

  const path = pathname.split("/").filter(Boolean)

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 supports-backdrop-filter:bg-card/80 supports-backdrop-filter:backdrop-blur">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Button className="rounded lg:hidden" size="icon" variant="outline">
              <IconMenu />
              <span className="sr-only">Menu</span>
            </Button>
            <Link href="/dashboard">
              <div className="flex items-center">
                <Image alt={APP_NAME} height={32} src="/logo.svg" width={32} />
                <span className="ml-2.5 hidden font-semibold text-xl sm:block">
                  {APP_NAME}
                </span>
              </div>
            </Link>
          </div>
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList className="gap-2">
              {NAV_ITEMS.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink className="py-2" href={item.href}>
                    <item.icon />
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
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
      </div>
      <div className="mx-auto flex max-w-7xl justify-between gap-x-6 gap-y-2 px-4 py-1.5 max-sm:flex-col sm:items-center sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<a href="/" />}>
                <IconHome className="size-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {path[0] && (
              <BreadcrumbItem>
                <BreadcrumbLink render={<a href={`/${path[0]}`} />}>
                  <span className="capitalize">{path[0]}</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {path[0] === "dashboard" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <span className="capitalize">Home</span>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            {path[1] && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <span className="capitalize">{path[1]}</span>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
