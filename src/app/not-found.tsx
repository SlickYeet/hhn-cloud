import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/constants/app"

export const metadata: Metadata = {
  description: "The page you are looking for does not exist.",
  title: "404 - Page Not Found",
}

function getSiteData(domain: string | null) {
  if (!domain) {
    return { name: "Unknown" }
  }
  const parts = domain.split(".")
  const name = parts[0] || "Unknown"
  return { name }
}

export default async function NotFound() {
  const headersList = await headers()
  const domain = headersList.get("host")
  const data = getSiteData(domain)

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[5rem_5rem] opacity-60"
      />

      <div className="relative w-full max-w-2xl text-center">
        <div className="mb-8 flex items-center justify-center gap-4 font-mono text-muted-foreground text-xs uppercase tracking-[0.24em]">
          <span className="h-px w-10 bg-primary/60" />
          <span>Looks like you&apos;re lost</span>
          <span className="h-px w-10 bg-primary/60" />
        </div>

        <p className="font-bold font-mono text-[clamp(7rem,24vw,13rem)] text-primary/20 leading-[0.8]">
          404
        </p>
        <div className="relative -mt-5 sm:-mt-8">
          <h1 className="text-3xl sm:text-4xl">This page does not exist</h1>
          <p className="mx-auto mt-5 max-w-md text-balance text-lg text-muted-foreground md:text-pretty">
            The page you are looking for does not exist on {data.name}.
          </p>
          <Button className="mt-8" render={<Link href="/" />} size="lg">
            Return to {APP_NAME}
          </Button>
        </div>
      </div>
    </main>
  )
}
