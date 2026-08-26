"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconCirclePlus, IconX } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { RESOURCE_PLANS } from "@/constants/resource-plans"
import { api } from "@/lib/api/client"
import { getOperatingSystemIcon, getResourcePlanIcon } from "@/lib/utils"
import { createInstanceSchema } from "@/schemas/instance"
import type { SshKey } from "@/schemas/ssh-key"

export function CreateInstanceModal({
  organizationId,
}: {
  organizationId: string
}) {
  const queryClient = useQueryClient()

  const [open, setOpen] = React.useState(false)

  const form = useForm<z.infer<typeof createInstanceSchema>>({
    defaultValues: {
      hostname: "",
      plan: undefined,
      sshKeyId: undefined,
      templateId: undefined,
    },
    resolver: zodResolver(createInstanceSchema),
  })

  const { data: templates } = useQuery(api.template.list.queryOptions())
  const { data: sshKeys } = useQuery(api.sshKey.list.queryOptions())

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
        setOpen(false)
      },
    }),
  )

  const isSubmitting = form.formState.isSubmitting || mutation.isPending

  function onSubmit(data: z.infer<typeof createInstanceSchema>) {
    mutation.mutate(data)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button size="lg" variant="secondary" />}>
        <IconCirclePlus />
        New instance
      </DialogTrigger>
      <DialogContent className="mb-8 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0">
        <ScrollArea className="flex flex-col justify-between overflow-hidden">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-6 pt-6">Create new instance</DialogTitle>
            <DialogDescription render={<div className="pt-2 pl-6" />}>
              Create a new instance in your organization
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex-1 space-y-6 px-6 py-8"
            id="create-instance-form"
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
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>SSH Key</FieldLabel>
                    </FieldContent>
                    <Combobox
                      disabled={isSubmitting}
                      items={sshKeys}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <ComboboxInput placeholder="Select an SSH key" />
                      <ComboboxContent>
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
                name="templateId"
                render={({ field, fieldState }) => (
                  <FieldSet disabled={isSubmitting}>
                    <FieldLegend>Operating System</FieldLegend>
                    <FieldDescription>
                      Select an operating system for your instance.
                    </FieldDescription>
                    <RadioGroup
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
                      disabled={isSubmitting}
                      name={field.name}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      {templates?.map((template) => {
                        const Icon = getOperatingSystemIcon(template.os)

                        return (
                          <FieldLabel
                            htmlFor={`template-${template.slug}`}
                            key={template.id}
                          >
                            <Field
                              className="disabled:cursor-not-allowed disabled:opacity-50"
                              data-invalid={fieldState.invalid}
                              disabled={template.status !== "active"}
                              orientation="horizontal"
                            >
                              <FieldContent className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Icon className="size-5" />
                                  <FieldTitle>{template.name}</FieldTitle>
                                </div>
                                <FieldDescription>
                                  {template.description}
                                </FieldDescription>
                              </FieldContent>
                              <RadioGroupItem
                                aria-invalid={fieldState.invalid}
                                id={`template-${template.slug}`}
                                value={template.id}
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
              <Controller
                control={form.control}
                name="plan"
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
                      {Object.entries(RESOURCE_PLANS).map(([key, plan]) => {
                        const Icon = getResourcePlanIcon(plan.id)

                        return (
                          <FieldLabel
                            aria-disabled={plan.disabled}
                            htmlFor={`plan-${key}`}
                            key={key}
                          >
                            <Field
                              className="disabled:cursor-not-allowed disabled:opacity-50"
                              data-invalid={fieldState.invalid}
                              disabled={plan.disabled}
                              orientation="horizontal"
                            >
                              <FieldContent className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Icon className="size-5" />
                                  <FieldTitle>{plan.name}</FieldTitle>
                                </div>
                                <FieldDescription>
                                  {plan.description}
                                </FieldDescription>
                              </FieldContent>
                              <RadioGroupItem
                                aria-invalid={fieldState.invalid}
                                id={`plan-${key}`}
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
          </form>
        </ScrollArea>
        <DialogFooter className="m-0 px-6 sm:justify-end">
          <DialogClose
            render={
              <Button disabled={isSubmitting} type="button" variant="outline" />
            }
          >
            <IconX /> Cancel
          </DialogClose>
          <Button
            disabled={isSubmitting}
            form="create-instance-form"
            type="submit"
          >
            <IconCirclePlus /> Create Instance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
