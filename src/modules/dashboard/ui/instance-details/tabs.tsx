"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const INSTANCE_DETAILS_TABS = [
  { label: "Overview", value: "overview" },
  { label: "Access", value: "access" },
  // { label: "Graphs", value: "graphs" },
  // { label: "Backups", value: "backups" },
  // { label: "Snapshots", value: "snapshots" },
  // { label: "Networking", value: "networking" },
  { label: "Firewall", value: "firewall" },
  // { label: "Volumes", value: "volumes" },
  // { label: "Power", value: "power" },
  // { label: "Rescue", value: "rescue" },
  // { label: "ISO Images", value: "images" },
  // { label: "Rescale", value: "rescale" },
  // { label: "Rebuild", value: "rebuild" },
  // { label: "Delete", value: "delete" },
]

export function InstanceDetailsTabs({ instanceId }: { instanceId: string }) {
  const pathname = usePathname()

  const activeTab =
    INSTANCE_DETAILS_TABS.find((tab) =>
      pathname?.startsWith(`/instance/${instanceId}/${tab.value}`),
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
                  href={`/instance/${instanceId}/${tab.value === "overview" ? "" : tab.value}`}
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
