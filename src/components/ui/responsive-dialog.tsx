"use client"

import * as React from "react"

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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import type { Breakpoint } from "@/hooks/use-media-query"
import { useIsBreakpoint } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface ResponsiveDialogContextValue {
  isMobile: boolean
}

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogContextValue | null>(null)

function useResponsiveDialogContext(
  component: string,
): ResponsiveDialogContextValue {
  const ctx = React.useContext(ResponsiveDialogContext)
  if (!ctx) {
    throw new Error(`<${component}> must be used within <ResponsiveDialog>`)
  }
  return ctx
}

interface ResponsiveDialogProps
  extends Omit<React.ComponentProps<typeof Dialog>, "children">,
    Pick<
      React.ComponentProps<typeof Drawer>,
      "showSwipeHandle" | "snapPoints" | "swipeDirection"
    > {
  children: React.ReactNode
  breakpoint?: Breakpoint | number
}

function ResponsiveDialog({
  breakpoint = "md",
  showSwipeHandle,
  snapPoints,
  swipeDirection,
  children,
  ...props
}: ResponsiveDialogProps) {
  const isMobile = useIsBreakpoint(breakpoint)
  const Root = (isMobile ? Drawer : Dialog) as React.ElementType

  const rootProps = isMobile
    ? { ...props, showSwipeHandle, snapPoints, swipeDirection }
    : props

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile }}>
      <Root data-slot="responsive-dialog" {...rootProps}>
        {children}
      </Root>
    </ResponsiveDialogContext.Provider>
  )
}

type TriggerProps = React.ComponentProps<typeof DialogTrigger> &
  React.ComponentProps<typeof DrawerTrigger>

function ResponsiveDialogTrigger(props: TriggerProps) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogTrigger")
  const Trigger = isMobile ? DrawerTrigger : DialogTrigger
  return <Trigger data-slot="responsive-dialog-trigger" {...props} />
}

type CloseProps = React.ComponentProps<typeof DialogClose> &
  React.ComponentProps<typeof DrawerClose>

function ResponsiveDialogClose(props: CloseProps) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogClose")
  const Close = isMobile ? DrawerClose : DialogClose
  return <Close data-slot="responsive-dialog-close" {...props} />
}

const CONTENT_SIZE_CLASSNAME = {
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-[calc(100%-2rem)]",
  lg: "sm:max-w-lg",
  md: "sm:max-w-md",
  sm: "sm:max-w-sm",
  xl: "sm:max-w-xl",
} as const

type ContentSize = keyof typeof CONTENT_SIZE_CLASSNAME

interface ResponsiveDialogContentProps {
  className?: string
  children: React.ReactNode
  size?: ContentSize
  dialogProps?: Omit<
    React.ComponentProps<typeof DialogContent>,
    "children" | "className"
  >
  drawerProps?: Omit<
    React.ComponentProps<typeof DrawerContent>,
    "children" | "className"
  >
}

function ResponsiveDialogContent({
  className,
  children,
  size = "md",
  dialogProps,
  drawerProps,
}: ResponsiveDialogContentProps) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogContent")

  if (isMobile) {
    return (
      <DrawerContent
        className={className}
        data-slot="responsive-dialog-content"
        {...drawerProps}
      >
        {children}
      </DrawerContent>
    )
  }

  return (
    <DialogContent
      className={cn(CONTENT_SIZE_CLASSNAME[size], className)}
      data-slot="responsive-dialog-content"
      {...dialogProps}
    >
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogHeader")
  const Header = isMobile ? DrawerHeader : DialogHeader
  return (
    <Header
      className={className}
      data-slot="responsive-dialog-header"
      {...props}
    />
  )
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogFooter")
  const Footer = isMobile ? DrawerFooter : DialogFooter
  return (
    <Footer
      className={className}
      data-slot="responsive-dialog-footer"
      {...props}
    />
  )
}

function ResponsiveDialogTitle(
  props: React.ComponentProps<typeof DialogTitle> &
    React.ComponentProps<typeof DrawerTitle>,
) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogTitle")
  const Title = isMobile ? DrawerTitle : DialogTitle
  return <Title data-slot="responsive-dialog-title" {...props} />
}

function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription> &
    React.ComponentProps<typeof DrawerDescription>,
) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogDescription")
  const Description = isMobile ? DrawerDescription : DialogDescription
  return <Description data-slot="responsive-dialog-description" {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
