import { IconCheck, IconCopy } from "@tabler/icons-react"
import { GlobeIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { cn } from "@/lib/utils"

export function IPAddress({ ipAddress }: { ipAddress: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const [isRevealed, setIsRevealed] = React.useState(false)

  function handleReveal() {
    if (isRevealed) setIsRevealed(false)
    else setIsRevealed(true)
  }

  const parsedIpAddress = isRevealed
    ? ipAddress
    : ipAddress.replace(/[a-zA-Z0-9]/g, "*")

  return (
    <div className="group/ipAddress flex items-center gap-2">
      <GlobeIcon
        className={cn(
          "size-4 stroke-primary group-hover/ipAddress:hidden",
          isCopied && "hidden",
        )}
      />
      <Button
        className={cn(
          "hidden w-4 group-hover/ipAddress:inline-flex",
          isCopied && "inline-flex",
        )}
        onClick={() => copyToClipboard(ipAddress)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            copyToClipboard(ipAddress)
          }
        }}
        size="icon-sm"
        variant="ghost"
      >
        {isCopied ? <IconCheck className="text-green-500" /> : <IconCopy />}
        <span className="sr-only">Copy to clipboard</span>
      </Button>
      <Button
        className="px-0 active:not-aria-[haspopup]:translate-y-0"
        onClick={handleReveal}
        size="sm"
        variant="ghost"
      >
        <span className="font-mono">{parsedIpAddress}</span>
      </Button>
    </div>
  )
}
