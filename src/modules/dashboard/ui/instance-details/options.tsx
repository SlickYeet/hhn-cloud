"use client"

import { IconSettings, IconWorld } from "@tabler/icons-react"
import { DatabaseBackupIcon, GroupIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemMedia } from "@/components/ui/item"

export function InstanceOptions({ instanceId }: { instanceId: string }) {
  return (
    <Card className="gap-4">
      <CardHeader className="px-8">
        <CardTitle className="flex items-center gap-2">
          <IconSettings className="size-5 stroke-primary" />
          <p className="text-lg uppercase">Options</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-row flex-wrap">
          <Item className="w-auto shrink-0 items-start gap-2">
            <ItemMedia className="mt-1" variant="icon">
              <DatabaseBackupIcon className="size-6 stroke-primary" />
            </ItemMedia>
            <div className="flex flex-col gap-2">
              <ItemActions>
                <Button onClick={() => alert("Coming soon!")}>Enable</Button>
              </ItemActions>
              <ItemContent>
                <p className="ml-1 uppercase">Backups</p>
              </ItemContent>
            </div>
          </Item>

          <Item className="w-auto shrink-0 items-start gap-2">
            <ItemMedia className="mt-1" variant="icon">
              <GroupIcon className="size-6 stroke-primary" />
            </ItemMedia>
            <div className="flex flex-col gap-2">
              <ItemActions>
                <Button disabled onClick={() => alert("Coming soon!")}>
                  Select group
                </Button>
              </ItemActions>
              <ItemContent>
                <p className="ml-1 uppercase">Placement Group</p>
              </ItemContent>
            </div>
          </Item>

          <Item className="w-auto shrink-0 items-start gap-2">
            <ItemMedia className="mt-1" variant="icon">
              <IconWorld className="size-6 stroke-primary" />
            </ItemMedia>
            <div className="flex flex-col gap-2">
              <ItemActions>
                <Button disabled onClick={() => alert("Coming soon!")}>
                  Disable
                </Button>
              </ItemActions>
              <ItemContent>
                <p className="ml-1 uppercase">Public Network</p>
              </ItemContent>
            </div>
          </Item>
        </div>
      </CardContent>
    </Card>
  )
}
