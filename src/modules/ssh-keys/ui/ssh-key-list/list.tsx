"use client"

import {
  IconCopy,
  IconDots,
  IconKeyFilled,
  IconTrash,
} from "@tabler/icons-react"
import { formatDistanceToNowStrict } from "date-fns"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { api } from "@/lib/api/client"
import type { SSHKey } from "@/schemas/ssh-key"

import { GenerateSSHKeyModal } from "./generate-ssh-key-modal"
import { ImportSSHKeyModal } from "./import-ssh-key-modal"

export function SshKeysTable({ new: newParam }: { new?: string }) {
  const [sshKeys] = api.sshKey.list.useSuspenseQuery()
  const router = useRouter()
  const [openModal, setOpenModal] = React.useState<
    "generate" | "import" | null
  >(newParam === "generate" || newParam === "import" ? newParam : null)

  React.useEffect(() => {
    if (newParam !== "generate" && newParam !== "import") return
    setOpenModal(newParam)
    const url = new URL(window.location.href)
    if (!url.searchParams.has("new")) return
    url.searchParams.delete("new")
    router.replace(`${url.pathname}${url.search}${url.hash}` as Route, {
      scroll: false,
    })
  }, [newParam, router])

  if (sshKeys.length === 0) {
    return (
      <Empty className="mt-4 rounded-2xl bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconKeyFilled className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>No SSH keys yet</EmptyTitle>
          <EmptyDescription className="text-muted-foreground text-sm">
            Generate a new key or import one you already use.
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-2">
          <GenerateSSHKeyModal
            onOpenChange={(open) => setOpenModal(open ? "generate" : null)}
            open={openModal === "generate"}
          />
          <ImportSSHKeyModal
            onOpenChange={(open) => setOpenModal(open ? "import" : null)}
            open={openModal === "import"}
          />
        </div>
      </Empty>
    )
  }

  return (
    <Card className="mt-4 space-y-4">
      <CardContent>
        <div className="flex justify-end gap-2">
          <ImportSSHKeyModal
            onOpenChange={(open) => setOpenModal(open ? "import" : null)}
            open={openModal === "import"}
          />
          <GenerateSSHKeyModal
            onOpenChange={(open) => setOpenModal(open ? "generate" : null)}
            open={openModal === "generate"}
          />
        </div>

        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Fingerprint</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sshKeys.map((key) => (
              <SshKeyRow key={key.id} sshKey={key} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SshKeyRow({ sshKey }: { sshKey: SSHKey }) {
  const utils = api.useUtils()
  const { copyToClipboard } = useCopyToClipboard()
  const [open, setOpen] = React.useState(false)

  const deleteKey = api.sshKey.delete.useMutation({
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(`Deleted "${sshKey.name}"`)
      void utils.sshKey.list.invalidate()
    },
  })

  function copyPublicKey() {
    copyToClipboard(sshKey.publicKey)
    toast.success("Public key copied")
  }

  function copyFingerprint() {
    copyToClipboard(sshKey.fingerprint)
    toast.success("Fingerprint copied")
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{sshKey.name}</TableCell>
      <TableCell>
        <Badge className="uppercase" variant="secondary">
          {sshKey.type}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-muted-foreground text-xs">
        {sshKey.fingerprint}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {sshKey.comment ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {sshKey.createdAt
          ? formatDistanceToNowStrict(new Date(sshKey.createdAt), {
              addSuffix: true,
            })
          : "—"}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="icon" variant="ghost" />}>
            <IconDots className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={copyPublicKey}>
                <IconCopy /> Copy public key
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyFingerprint}>
                <IconCopy /> Copy fingerprint
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20 *:[svg]:text-destructive"
                disabled={deleteKey.isPending}
                onClick={() => setOpen(true)}
              >
                <IconTrash />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog onOpenChange={setOpen} open={open}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                <IconTrash />
              </AlertDialogMedia>
              <AlertDialogTitle>
                Delete &quot;{sshKey.name}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Any instance using this key for authentication will need a
                different key configured, or it may become inaccessible. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteKey.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteKey.isPending}
                onClick={() => deleteKey.mutate({ id: sshKey.id })}
                variant="destructive"
              >
                {deleteKey.isPending && <Spinner />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  )
}
