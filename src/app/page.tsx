import { IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default async function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1>Page</h1>
      <Button
        className="mt-4"
        nativeButton={false}
        render={<Link href="/dashboard" />}
        size="lg"
      >
        Get Started <IconArrowRight />
      </Button>
    </main>
  )
}
