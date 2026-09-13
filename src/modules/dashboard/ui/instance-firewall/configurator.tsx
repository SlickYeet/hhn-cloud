"use client"

import type { DragEndEvent } from "@dnd-kit/core"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
  IconPlus,
  IconPower,
  IconTrash,
} from "@tabler/icons-react"
import { RotateCcwIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Hint } from "@/components/hint"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FIREWALL_RULE_PRIORITY_STEP } from "@/constants/app"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { useDebouncedReorder } from "@/modules/dashboard/hooks/use-debounced-reorder"
import type { InstanceFirewallRule } from "@/schemas/firewall-rule"
import {
  firewallRuleActionEnum,
  firewallRuleProtocolEnum,
  firewallRuleSourceTypeEnum,
} from "@/server/db/schema"

function SyncStatusBadge({ instanceId }: { instanceId: string }) {
  const utils = api.useUtils()

  const { data } = api.instance.firewallStatus.useQuery(
    { instanceId },
    {
      refetchInterval: (query) =>
        query.state.data?.firewallSyncStatus === "pending" ? 1500 : false,
    },
  )

  const retry = api.firewallRule.retrySync.useMutation({
    async onSuccess() {
      await utils.instance.firewallStatus.invalidate({ instanceId })
    },
  })

  if (!data) return null

  if (data.firewallSyncStatus === "synced") {
    return (
      <Badge className="gap-1.5" variant="success">
        <span className="size-1.5 rounded-full bg-green-600 dark:bg-green-500" />
        Fully applied
      </Badge>
    )
  }

  if (data.firewallSyncStatus === "pending") {
    return (
      <Badge className="gap-1.5" variant="warning">
        <span className="size-1.5 animate-pulse rounded-full bg-yellow-600 dark:bg-yellow-500" />
        Syncing…
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className="gap-1.5" variant="destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Sync failed
      </Badge>
      <Button
        disabled={retry.isPending}
        onClick={() => retry.mutate({ instanceId })}
        size="sm"
        variant="outline"
      >
        <RotateCcwIcon className="size-3.5" />
        Retry
      </Button>
    </div>
  )
}

function SortableRuleRow({
  isFirst,
  isLast,
  onChange,
  onDelete,
  onMove,
  rule,
}: {
  isFirst: boolean
  isLast: boolean
  onChange: (patch: Partial<InstanceFirewallRule>) => void
  onDelete: () => void
  onMove: (direction: "up" | "down") => void
  rule: InstanceFirewallRule
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: rule.id })
  const isMobile = useIsMobile()

  const style = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    // TODO: make UI better and mobile friendly
    <Card className="relative p-4" ref={setNodeRef} style={style}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-2 pt-1">
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className={cn(
              "cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing",
              isMobile && "hidden",
            )}
            type="button"
          >
            <IconGripVertical className="size-5" />
          </button>
          <button
            aria-label="Move rule up"
            className="cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-30"
            disabled={isFirst}
            onClick={() => onMove("up")}
            type="button"
          >
            <IconChevronUp className="size-4" />
          </button>
          <button
            aria-label="Move rule down"
            className="cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-30"
            disabled={isLast}
            onClick={() => onMove("down")}
            type="button"
          >
            <IconChevronDown className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <Input
            onChange={(e) => onChange({ comment: e.target.value || null })}
            placeholder="Rule description"
            value={rule.comment ?? ""}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Select
              onValueChange={(val) =>
                onChange({ action: val as InstanceFirewallRule["action"] })
              }
              value={rule.action}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {firewallRuleActionEnum.enumValues.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(val) =>
                onChange({
                  sourceCidr: val === "cidr" ? rule.sourceCidr : null,
                  sourceType: val as InstanceFirewallRule["sourceType"],
                })
              }
              value={rule.sourceType}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {firewallRuleSourceTypeEnum.enumValues.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {rule.sourceType === "cidr" && (
              <Input
                className="w-44"
                onChange={(e) => onChange({ sourceCidr: e.target.value })}
                placeholder="203.0.113.4/32"
                value={rule.sourceCidr ?? ""}
              />
            )}

            <Select
              onValueChange={(v) =>
                onChange({ protocol: v as InstanceFirewallRule["protocol"] })
              }
              value={rule.protocol}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {firewallRuleProtocolEnum.enumValues.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {rule.protocol !== "icmp" && (
              <Input
                className="w-36"
                onChange={(e) =>
                  onChange({ portRange: e.target.value || null })
                }
                placeholder="Port or range"
                value={rule.portRange ?? ""}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 pt-1">
          <Hint
            label={rule.enabled ? "Disable Rule" : "Enable Rule"}
            render={
              <Button
                className="group/disable text-muted-foreground hover:text-destructive"
                onClick={() => onChange({ enabled: !rule.enabled })}
                size="icon"
                variant="ghost"
              >
                <IconPower
                  className={cn(
                    "size-5 transition",
                    rule.enabled
                      ? "stroke-green-500 group-hover/disable:stroke-destructive"
                      : "group-hover/disable:stroke-green-500",
                  )}
                />
              </Button>
            }
            side="left"
          />
          <Hint
            label="Remove Rule"
            render={
              <Button
                className="text-muted-foreground hover:text-destructive"
                onClick={onDelete}
                size="icon"
                variant="ghost"
              >
                <IconTrash className="size-5" />
              </Button>
            }
            side="left"
          />
        </div>
      </div>
    </Card>
  )
}

export function InstanceFirewallConfigurator({
  instanceId,
}: {
  instanceId: string
}) {
  const utils = api.useUtils()

  const debouncedReorder = useDebouncedReorder(instanceId)

  const { data: rules } = api.firewallRule.list.useQuery({ instanceId })

  // biome-ignore assist/source/useSortedKeys: onMutate must appear before onError for TContext inference
  const update = api.firewallRule.update.useMutation({
    async onMutate(patch) {
      await utils.firewallRule.list.cancel({ instanceId })
      const prevData = utils.firewallRule.list.getData({ instanceId })

      utils.firewallRule.list.setData({ instanceId }, (old) =>
        old?.map((rule) =>
          rule.id === patch.id ? { ...rule, ...patch } : rule,
        ),
      )

      return { prevData }
    },
    onError(error, _patch, ctx) {
      if (ctx?.prevData) {
        utils.firewallRule.list.setData({ instanceId }, ctx.prevData)
      }

      console.error("Failed to update firewall rule:", error)
      toast.error("Something went wrong!", {
        description: error.message,
      })
    },
    async onSettled() {
      await utils.firewallRule.list.invalidate({ instanceId })
      await utils.instance.firewallStatus.invalidate({ instanceId })
    },
  })
  // biome-ignore assist/source/useSortedKeys: onMutate must appear before onError for TContext inference
  const remove = api.firewallRule.delete.useMutation({
    async onMutate({ id }) {
      await utils.firewallRule.list.cancel({ instanceId })
      const prevData = utils.firewallRule.list.getData({ instanceId })

      utils.firewallRule.list.setData({ instanceId }, (old) =>
        old?.filter((rule) => rule.id !== id),
      )

      return { prevData }
    },
    onError(error, _input, ctx) {
      if (ctx?.prevData) {
        utils.firewallRule.list.setData({ instanceId }, ctx.prevData)
      }

      console.error("Failed to remove firewall rule:", error)
      toast.error("Something went wrong!", {
        description: error.message,
      })
    },
    async onSettled() {
      await utils.firewallRule.list.invalidate({ instanceId })
      await utils.instance.firewallStatus.invalidate({ instanceId })
    },
  })
  // biome-ignore assist/source/useSortedKeys: onMutate must appear before onError for TContext inference
  const create = api.firewallRule.create.useMutation({
    async onMutate(input) {
      await utils.firewallRule.list.cancel({ instanceId })
      const prevData = utils.firewallRule.list.getData({ instanceId })

      const optimisticRule: InstanceFirewallRule = {
        action: input.action,
        comment: input.comment ?? null,
        enabled: input.enabled ?? true,
        id: `optimistic-${crypto.randomUUID()}`,
        instanceId,
        portRange: input.portRange ?? null,
        priority:
          input.priority ??
          (prevData?.[prevData.length - 1]?.priority ?? 0) +
            FIREWALL_RULE_PRIORITY_STEP,
        protocol: input.protocol,
        sourceCidr: input.sourceCidr ?? null,
        sourceType: input.sourceType,
      }

      utils.firewallRule.list.setData({ instanceId }, (old) => [
        ...(old ?? []),
        optimisticRule,
      ])

      return { prevData }
    },
    onError(error, _input, ctx) {
      if (ctx?.prevData) {
        utils.firewallRule.list.setData({ instanceId }, ctx.prevData)
      }

      console.error("Failed to create firewall rule:", error)
      toast.error("Something went wrong!", {
        description: error.message,
      })
    },
    async onSettled() {
      await utils.firewallRule.list.invalidate({ instanceId })
      await utils.instance.firewallStatus.invalidate({ instanceId })
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const orderedIds = React.useMemo(
    () => rules?.map((rule) => rule.id) ?? [],
    [rules],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id || !rules) return

    const oldIndex = orderedIds.indexOf(String(active.id))
    const newIndex = orderedIds.indexOf(String(over.id))
    const next = [...orderedIds]
    next.splice(oldIndex, 1)
    next.splice(newIndex, 0, String(active.id))
    debouncedReorder(next)
  }

  function moveRule(index: number, direction: "up" | "down") {
    if (!rules) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= rules.length) return

    const next = [...orderedIds]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    debouncedReorder(next)
  }

  if (!rules) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SyncStatusBadge instanceId={instanceId} />
        <Button
          onClick={() =>
            create.mutate({
              action: "ACCEPT",
              enabled: true,
              instanceId,
              priority: rules.length + 1,
              protocol: "tcp",
              sourceType: "any",
            })
          }
          size="sm"
        >
          <IconPlus /> Add rule
        </Button>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        id={`instance-firewall-${instanceId}`}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={orderedIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <SortableRuleRow
                isFirst={idx === 0}
                isLast={idx === rules.length - 1}
                key={rule.id}
                onChange={(patch) => update.mutate({ id: rule.id, ...patch })}
                onDelete={() => remove.mutate({ id: rule.id })}
                onMove={(dir) => moveRule(idx, dir)}
                rule={rule}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
