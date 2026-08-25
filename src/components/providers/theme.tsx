"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import type * as React from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scriptProps =
    typeof window === "undefined"
      ? undefined
      : ({ type: "application/json" } as const)

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      scriptProps={scriptProps}
    >
      {children}
    </NextThemeProvider>
  )
}
