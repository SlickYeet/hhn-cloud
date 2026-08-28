"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconCirclePlus, IconRefreshAlert } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type * as z from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api/client"
import {
  cn,
  getOperatingSystemCategoryIcon,
  getOperatingSystemIcon,
  getOperatingSystemStatusColor,
  getResourcePlanIcon,
  getResourcePlanStatusColor,
} from "@/lib/utils"
import { CreateSshKeyModal } from "@/modules/dashboard/ui/create-ssh-key-modal"
import { createInstanceSchema } from "@/schemas/instance"
import type { SshKey } from "@/schemas/ssh-key"

export function CreateInstanceForm({
  organizationId,
}: {
  organizationId: string
}) {
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof createInstanceSchema>>({
    defaultValues: {
      hostname: "",
      operatingSystemId: "",
      resourcePlanId: "",
      sshKeyId: "",
    },
    resolver: zodResolver(createInstanceSchema),
  })

  const { data: sshKeys } = useQuery(api.sshKey.list.queryOptions())
  const { data: operatingSystemCategories } = useQuery(
    api.operatingSystem.category.list.queryOptions(),
  )
  const { data: operatingSystems } = useQuery(
    api.operatingSystem.list.queryOptions(),
  )
  const { data: resourcePlans } = useQuery(api.resourcePlan.list.queryOptions())

  const mutation = useMutation(
    api.instance.create.mutationOptions({
      onError(error) {
        toast.error("Failed to create instance:", {
          description: error.message,
          position: "top-center",
        })
      },
      onSuccess() {
        queryClient.invalidateQueries({
          queryKey: api.instance.list.key({ input: { organizationId } }),
        })
        toast.success("Instance created successfully!", {
          position: "top-center",
        })
        form.reset()
      },
    }),
  )

  const isSubmitting = form.formState.isSubmitting || mutation.isPending

  function onSubmit(data: z.infer<typeof createInstanceSchema>) {
    mutation.mutate(data)
  }

  // TODO: make form multistep
  // ? 1. Hostname and SSH Key (prettify the SSH key selection)
  // ? 2. Operating System
  // ? 3. Resource Plan
  // ? 4. Review and Create

  return (
    <Card>
      <CardContent>
        <form
          className="flex-1 space-y-6 px-0 py-4 md:px-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="flex flex-col md:flex-row">
            <Controller
              control={form.control}
              name="hostname"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Hostname</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                    id={field.name}
                    placeholder="web-server-01"
                    type="text"
                  />
                  <FieldDescription>
                    This is used as the virtual machine&apos;s hostname and to
                    identify your instance on the dashboard, in notifications,
                    and activity logs.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="sshKeyId"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  disabled={isSubmitting}
                >
                  <FieldContent className="space-y-2">
                    <FieldLabel htmlFor={field.name}>SSH Key</FieldLabel>
                    <ButtonGroup className="w-full">
                      <Combobox
                        items={sshKeys}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <ComboboxInput
                          className="flex-1"
                          placeholder="Select an SSH key"
                        />
                        <ComboboxContent className="bg-input/30">
                          <ComboboxEmpty>No SSH keys found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item: SshKey) => (
                              <ComboboxItem key={item.id} value={item.id}>
                                {item.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      <CreateSshKeyModal disabled={isSubmitting} />
                    </ButtonGroup>
                    <FieldDescription>
                      Select an SSH key to use for connecting to your instance.
                    </FieldDescription>
                  </FieldContent>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <FieldGroup>
            <Controller
              control={form.control}
              name="operatingSystemId"
              render={({ field, fieldState }) => (
                <FieldSet disabled={isSubmitting}>
                  <FieldLegend>Operating System</FieldLegend>
                  <FieldDescription>
                    Select an operating system for your instance.
                  </FieldDescription>

                  <Tabs defaultValue={operatingSystemCategories?.[0]?.id}>
                    <TabsList className="h-40! w-full" variant="line">
                      {operatingSystemCategories?.map((category) => {
                        const Icon = getOperatingSystemCategoryIcon(
                          category.name.toLowerCase(),
                        )

                        return (
                          <TabsTrigger
                            className="cursor-pointer after:bg-primary group-data-[variant=line]/tabs-list:data-active:border group-data-[variant=line]/tabs-list:data-active:border-primary/50! group-data-[variant=line]/tabs-list:data-active:bg-primary/10! group-data-[variant=line]/tabs-list:data-active:after:opacity-0"
                            key={category.id}
                            value={category.id}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Icon className="size-16" />
                              <span className="font-semibold text-2xl capitalize">
                                {category.name}
                              </span>
                            </div>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                    {operatingSystemCategories?.map((category) => {
                      const Icon = getOperatingSystemCategoryIcon(
                        category.name.toLowerCase(),
                      )

                      const filteredOperatingSystems = operatingSystems?.filter(
                        (os) => os.release?.categoryId === category.id,
                      )

                      if (
                        !filteredOperatingSystems ||
                        filteredOperatingSystems.length === 0
                      ) {
                        return (
                          <TabsContent
                            className="h-full min-h-0 flex-1 overflow-y-auto py-4"
                            key={category.id}
                            value={category.id}
                          >
                            <div className="rounded-md border border-dashed p-8 text-center">
                              <Icon className="mx-auto size-12 text-muted-foreground" />
                              <p className="mt-2 font-medium text-sm">
                                No{" "}
                                <span className="capitalize">
                                  {category.name}{" "}
                                </span>
                                operating systems found
                              </p>
                              <p className="mx-auto mt-2 max-w-md text-balance text-muted-foreground text-sm">
                                Unfortunately, there are no operating systems
                                available in this category.
                              </p>
                            </div>
                          </TabsContent>
                        )
                      }

                      return (
                        <TabsContent
                          className="h-full min-h-0 flex-1 py-4"
                          key={category.id}
                          value={category.id}
                        >
                          <RadioGroup
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
                            disabled={isSubmitting}
                            name={field.name}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            {filteredOperatingSystems?.map(
                              (operatingSystem) => {
                                const Icon = getOperatingSystemIcon(
                                  operatingSystem.release?.family,
                                )

                                return (
                                  <FieldLabel
                                    aria-disabled={
                                      operatingSystem.status !== "active"
                                    }
                                    className={cn(
                                      "border-l-4! bg-input/30 text-foreground! has-data-checked:border-primary/50! has-data-checked:hover:bg-primary/10!",
                                      getOperatingSystemStatusColor(
                                        operatingSystem.status,
                                      ),
                                    )}
                                    htmlFor={`operatingSystem-${operatingSystem.slug}`}
                                    key={operatingSystem.id}
                                  >
                                    <Field
                                      className="relative disabled:cursor-not-allowed disabled:opacity-50"
                                      data-invalid={fieldState.invalid}
                                      disabled={
                                        operatingSystem.status !== "active"
                                      }
                                      orientation="horizontal"
                                    >
                                      <FieldContent className="space-y-1">
                                        <div className="mb-3 flex items-center gap-2">
                                          <Icon className="size-5" />
                                          <FieldTitle>
                                            {operatingSystem.name}
                                          </FieldTitle>
                                        </div>
                                        {operatingSystem.release?.codename && (
                                          <FieldDescription className="text-foreground/70 capitalize">
                                            {operatingSystem.release?.codename}
                                          </FieldDescription>
                                        )}
                                        <FieldDescription className="text-foreground/70 text-xs capitalize">
                                          Status:{" "}
                                          <span
                                            className={getOperatingSystemStatusColor(
                                              operatingSystem.status,
                                            )}
                                          >
                                            {operatingSystem.status}
                                          </span>
                                        </FieldDescription>
                                      </FieldContent>
                                      <RadioGroupItem
                                        aria-invalid={fieldState.invalid}
                                        id={`operatingSystem-${operatingSystem.slug}`}
                                        value={operatingSystem.id}
                                      />
                                    </Field>
                                  </FieldLabel>
                                )
                              },
                            )}
                          </RadioGroup>
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldSet>
              )}
            />
            <Controller
              control={form.control}
              name="resourcePlanId"
              render={({ field, fieldState }) => (
                <FieldSet disabled={isSubmitting}>
                  <FieldLegend>Resource Plan</FieldLegend>
                  <FieldDescription>
                    Select a plan for your instance. Each plan has different
                    resource allocations.
                  </FieldDescription>
                  <RadioGroup
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
                    disabled={isSubmitting}
                    name={field.name}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    {resourcePlans?.map((plan) => {
                      const Icon = getResourcePlanIcon(plan.id)

                      return (
                        <FieldLabel
                          aria-disabled={plan.status !== "active"}
                          className={cn(
                            "border-l-4! bg-input/30 text-foreground! has-data-checked:border-primary/50! has-data-checked:hover:bg-primary/10!",
                            getResourcePlanStatusColor(plan.status),
                          )}
                          htmlFor={`plan-${plan.id}`}
                          key={plan.id}
                        >
                          <Field
                            className="disabled:cursor-not-allowed disabled:opacity-50"
                            data-invalid={fieldState.invalid}
                            disabled={plan.status !== "active"}
                            orientation="horizontal"
                          >
                            <FieldContent className="space-y-2">
                              <div className="mb-1 flex items-center gap-2">
                                <Icon className="size-5" />
                                <FieldTitle>{plan.name}</FieldTitle>
                              </div>
                              <FieldDescription className="text-foreground/70">
                                {plan.description}
                              </FieldDescription>
                              <FieldDescription className="text-foreground/70 text-xs capitalize">
                                Status:{" "}
                                <span
                                  className={getResourcePlanStatusColor(
                                    plan.status,
                                  )}
                                >
                                  {plan.status}
                                </span>
                              </FieldDescription>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <Badge variant="outline">
                                  {plan.cores} vCPU{plan.cores > 1 ? "s" : ""}
                                </Badge>
                                <Badge variant="outline">
                                  {plan.memory} Memory
                                </Badge>
                                <Badge variant="outline">
                                  {plan.disk} GB Disk
                                </Badge>
                              </div>
                            </FieldContent>
                            <RadioGroupItem
                              aria-invalid={fieldState.invalid}
                              id={`plan-${plan.id}`}
                              value={plan.id}
                            />
                          </Field>
                        </FieldLabel>
                      )
                    })}
                  </RadioGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldSet>
              )}
            />
          </FieldGroup>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              disabled={isSubmitting}
              onClick={() => form.reset()}
              type="button"
              variant="outline"
            >
              <IconRefreshAlert /> Reset
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? <Spinner /> : <IconCirclePlus />}
              Create Instance
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
