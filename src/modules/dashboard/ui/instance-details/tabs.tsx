"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { INSTANCE_DETAILS_TABS } from "@/constants/app"

export function InstanceDetailsTabs({ instanceId }: { instanceId: string }) {
  const pathname = usePathname()

  const activeTab =
    INSTANCE_DETAILS_TABS.find((tab) =>
      pathname?.startsWith(`/dashboard/instance/${instanceId}/${tab.value}`),
    )?.value || "overview"

  return (
    <Tabs className="w-full" defaultValue={activeTab} suppressHydrationWarning>
      <ScrollArea>
        <TabsList className="mb-[0.05rem] gap-4 px-0" variant="line">
          {INSTANCE_DETAILS_TABS.map((tab) => (
            <TabsTrigger
              className="cursor-pointer text-base data-active:text-primary data-active:after:bg-primary! dark:data-active:text-primary"
              key={tab.value}
              nativeButton={false}
              render={
                <Link
                  // @ts-expect-error: typedRoutes cannot be used here
                  href={`/dashboard/instance/${instanceId}/${tab.value === "overview" ? "" : tab.value}`}
                />
              }
              value={tab.value}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollArea>
    </Tabs>
  )
}
