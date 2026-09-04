"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconAlertCircleFilled,
  IconCheck,
  IconCopy,
  IconDownload,
  IconPlus,
} from "@tabler/icons-react"
import JSZip from "jszip"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type * as z from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { SSHKey } from "@/schemas/ssh-key"
import { createSshKeySchema } from "@/schemas/ssh-key"

export function CreateSshKeyModal({
  render,
  children,
  className,
}: {
  render?: React.ReactElement
  children?: React.ReactNode
  className?: string
}) {
  const utils = api.useUtils()
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const [downloaded, setDownloaded] = React.useState(false)
  const [sshKey, setSshKey] = React.useState<
    (SSHKey & { privateKey: string }) | null
  >(null)

  const form = useForm<z.infer<typeof createSshKeySchema>>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(createSshKeySchema),
  })

  const createSshKey = api.sshKey.create.useMutation({
    onError(error) {
      toast.error("Failed to create SSH key:", {
        description: error.message,
        position: "top-center",
      })
    },
    async onSuccess(data) {
      setSshKey(data)
      form.reset()
      await utils.sshKey.list.invalidate()
    },
  })

  const isDisabled = form.formState.isSubmitting || createSshKey.isPending

  function onSubmit(data: z.infer<typeof createSshKeySchema>) {
    if (isDisabled) return
    createSshKey.mutate(data)
  }

  function handleCopyPrivateKey() {
    copyToClipboard(sshKey?.privateKey || "")
  }

  function handleDownloadKey(
    privateKey: string,
    publicKey: string,
    keyName: string,
  ) {
    const zip = new JSZip()
    zip.file(`id_${keyName.toLowerCase().replace(/\s/g, "_")}.pem`, privateKey)
    zip.file(`id_${keyName.toLowerCase().replace(/\s/g, "_")}.pub`, publicKey)
    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = `id_${keyName.toLowerCase().replace(/\s/g, "_")}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    setDownloaded(true)
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          setSshKey(null)
          setDownloaded(false)
        }
      }}
    >
      <AlertDialogTrigger
        className={cn(className)}
        render={
          render || (
            <Button
              className="hover:bg-transparent! hover:text-foreground! hover:no-underline"
              disabled={isDisabled}
              size="sm"
              type="button"
              variant="link"
            />
          )
        }
      >
        {children ? (
          children
        ) : (
          <>
            <IconPlus /> Add SSH Key
          </>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        {sshKey ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                SSH Key Pair Created Successfully
              </AlertDialogTitle>
            </AlertDialogHeader>

            <Alert variant="warning">
              <IconAlertCircleFilled />
              <AlertTitle className="font-semibold">Important:</AlertTitle>
              <AlertDescription>
                For security reasons, this is the <strong>only</strong> time you
                will be able to view or download your private key. Make sure to
                store it safely.
              </AlertDescription>
            </Alert>

            <div className="mt-4 flex flex-col gap-4">
              <div>
                <Label className="mb-2 block font-medium">Private Key:</Label>
                <InputGroup>
                  <InputGroupTextarea
                    className="wrap-break-word field-sizing-fixed max-h-24 resize-none font-mono"
                    readOnly
                    rows={6}
                    value={sshKey.privateKey}
                  />
                  <InputGroupAddon align="inline-end" className="items-start">
                    <InputGroupButton
                      className="ml-auto text-foreground"
                      onClick={handleCopyPrivateKey}
                      size="icon-xs"
                      type="button"
                    >
                      {isCopied ? (
                        <IconCheck className="text-green-500" />
                      ) : (
                        <IconCopy />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <AlertDialogFooter>
                {downloaded && (
                  <AlertDialogCancel type="button">Close</AlertDialogCancel>
                )}
                <Button
                  onClick={() => {
                    handleDownloadKey(
                      sshKey.privateKey,
                      sshKey.publicKey,
                      sshKey.name,
                    )
                  }}
                  type="button"
                >
                  <IconDownload />
                  Download Key
                </Button>
              </AlertDialogFooter>
            </div>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New SSH Key Pair</AlertDialogTitle>
              <AlertDialogDescription>
                Generate a new SSH key pair for secure access to your computes.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form
              className="space-y-4"
              id="create-ssh-key-form"
              onSubmit={(e) => {
                e.stopPropagation()
                form.handleSubmit(onSubmit)(e)
              }}
            >
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={isDisabled}
                      id={field.name}
                      placeholder="My SSH Key"
                      type="text"
                    />
                    <FieldDescription>
                      A descriptive name for your SSH key pair. This will help
                      you identify it later.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </form>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDisabled} type="button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isDisabled}
                form="create-ssh-key-form"
                type="submit"
              >
                {createSshKey.isPending ? <Spinner /> : <IconPlus />}
                Create
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
