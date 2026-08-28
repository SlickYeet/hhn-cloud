import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getSession } from "@/server/auth/utils"

export default async function Layout({ children }: LayoutProps<"/">) {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  return (
    <>
      <DashboardHeader session={session} />
      <div className="relative z-1 size-full flex-1 before:absolute before:inset-x-0 before:top-0 before:-z-1 before:h-105 before:bg-primary">
        {children}
      </div>
    </>
  )
}
