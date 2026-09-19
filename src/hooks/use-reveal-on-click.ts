import * as React from "react"

export function useRevealOnClick() {
  const [isRevealed, setIsRevealed] = React.useState(false)

  const handleReveal = React.useCallback(() => {
    setIsRevealed((previous) => !previous)
  }, [])

  const getDisplayText = React.useCallback(
    (text: string) => (isRevealed ? text : text.replace(/[a-zA-Z0-9]/g, "*")),
    [isRevealed],
  )

  return {
    getDisplayText,
    handleReveal,
    isRevealed,
  }
}
