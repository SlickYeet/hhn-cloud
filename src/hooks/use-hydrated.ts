"use client"

import * as React from "react"

export function useHydrated() {
  const [isHydrated, setIsHydrated] = React.useState(false)

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}
