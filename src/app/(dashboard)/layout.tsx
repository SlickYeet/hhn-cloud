import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getSession } from "@/server/auth/utils"

export default async function Layout({ children }: LayoutProps<"/">) {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  return (
    <>
      <DashboardHeader session={session} />
      <main>{children}</main>
    </>
  )
}
