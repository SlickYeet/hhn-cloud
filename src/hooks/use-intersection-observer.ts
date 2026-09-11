"use client"

import * as React from "react"

export function useIntersectionObserver(opts?: IntersectionObserverInit) {
  const targetRef = React.useRef<HTMLDivElement | null>(null)

  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, opts)

    if (targetRef.current) observer.observe(targetRef.current)

    return () => observer.disconnect()
  }, [opts])

  return {
    isIntersecting,
    targetRef,
  }
}
