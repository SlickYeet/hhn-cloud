"use client"

import type { Icon as IconType } from "@tabler/icons-react"
import {
  IconApi,
  IconHeartHandshake,
  IconLayoutDashboard,
  IconPlus,
  IconSearch,
  IconServer2,
  IconUsers,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Icons } from "@/components/icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { APP_NAME } from "@/constants/app"
import { getApiVersion, getBaseUrl } from "@/lib/utils"
import { FooterNav } from "@/modules/dashboard/layout/sidebar/footer-nav"
import { MainNav } from "@/modules/dashboard/layout/sidebar/main-nav"
import { OrgNav } from "@/modules/dashboard/layout/sidebar/org-nav"

export type NavItem = {
  extra?: {
    render: React.ReactNode
  }
  href: string
  icon: IconType
  isActive: boolean
  label: string
}

type NavItems = {
  dashboard: NavItem[]
  organization: NavItem[]
  footer: NavItem[]
}

export function DashboardSidebar() {
  const pathname = usePathname()

  const NAV_ITEMS: NavItems = {
    dashboard: [
      {
        href: "/dashboard",
        icon: IconLayoutDashboard,
        isActive: pathname === "/dashboard",
        label: "Dashboard",
      },
      {
        extra: {
          render: (
            <SidebarMenuAction
              render={<Link href="/dashboard/instance/create" />}
            >
              <IconPlus />
              <span className="sr-only">Create Instance</span>
            </SidebarMenuAction>
          ),
        },
        href: "/dashboard/instance/list",
        icon: IconServer2,
        isActive: pathname.startsWith("/dashboard/instance"),
        label: "Instances",
      },
    ],
    footer: [
      {
        href: "https://hub.famlam.ca",
        icon: IconHeartHandshake,
        isActive: false,
        label: "HHN Hub",
      },
      {
        href: "https://wiki.famlam.ca",
        icon: IconSearch,
        isActive: false,
        label: "Wiki",
      },
      {
        href: `${getBaseUrl()}/api/v${getApiVersion()}`,
        icon: IconApi,
        isActive: false,
        label: "API Docs",
      },
    ],
    organization: [
      {
        href: "/dashboard/organization",
        icon: IconUsers,
        isActive: pathname.startsWith("/dashboard/organization"),
        label: "Organization",
      },
    ],
  }

  return (
    <Sidebar
      className="p-6 pr-0 *:data-[slot=sidebar-inner]:group-data-[variant=floating]:rounded-xl"
      collapsible="icon"
      variant="floating"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="gap-2.5 bg-transparent! p-2 group-data-[collapsible=icon]:p-0! [&>svg]:size-8 [&_svg]:size-4"
              render={<Link href="/dashboard" />}
              size="lg"
            >
              <Icons.logo />
              <div className="flex flex-col items-start">
                <span className="text-nowrap font-semibold text-lg">
                  {APP_NAME}
                </span>
                <span className="text-nowrap font-light text-xs">
                  Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
        <MainNav items={NAV_ITEMS.dashboard} />
        <OrgNav items={NAV_ITEMS.organization} />
      </SidebarContent>
      <SidebarFooter className="px-0">
        <FooterNav items={NAV_ITEMS.footer} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
