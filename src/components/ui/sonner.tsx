"use client"

import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconLoader,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import type { ToasterProps } from "sonner"
import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      className="toaster group"
      icons={{
        error: <IconAlertOctagon className="size-4" />,
        info: <IconInfoCircle className="size-4" />,
        loading: <IconLoader className="size-4 animate-spin" />,
        success: <IconCircleCheck className="size-4" />,
        warning: <IconAlertTriangle className="size-4" />,
      }}
      style={
        {
          "--border-radius": "var(--radius)",
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
