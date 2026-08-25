import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getSession } from "@/server/auth/utils"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) return redirect("/auth/sign-in")

  return (
    <>
      <DashboardHeader session={session} />
      <main>
        <h1>Page</h1>
      </main>
    </>
  )
}
