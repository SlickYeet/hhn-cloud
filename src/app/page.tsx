import { IconArrowRight } from "@tabler/icons-react"
import { headers } from "next/headers"
import Link from "next/link"

import { APIKey } from "@/components/api-key"
import { Org } from "@/components/org"
import { api } from "@/lib/api/server"
import { auth } from "@/server/auth"

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const organizationId = session?.session?.activeOrganizationId || ""
  const instances = session?.session
    ? await api.instance.list({ organizationId })
    : null

  return (
    <main className="p-6">
      <h1 className="font-bold text-2xl">Home Page</h1>
      {session?.session && <Org session={session.session} />}
      {session?.session && <APIKey />}
      {!instances || instances.length === 0 ? (
        <p className="mt-4">No instances found for the organization</p>
      ) : (
        instances.map((i) => {
          return (
            <div
              className="mt-4 grid grid-cols-1 gap-2 border border-neutral-600 p-4 md:grid-cols-3"
              key={i.id}
            >
              <p>{i.hostname}</p>
              <p>CPU: {i.cores}</p>
              <p>Memory: {i.memory}</p>
              <p>Disk: {i.disk}</p>
              <p>Status: {i.status}</p>
              <p>Template: {i.templateId}</p>
              <p>Network: {i.networkId}</p>
              <p>VMID: {i.pveVmid}</p>
              <p>Created At: {i.createdAt?.toISOString()}</p>
              <p>Updated At: {i.updatedAt?.toISOString()}</p>
              <p>Deleted At: {i.deletedAt?.toISOString() || "Not deleted"}</p>
              <p>Organization ID: {i.organizationId}</p>
              <p>IP Address: {i.ipAllocations[0]?.ipAddress}</p>
              <p>MAC Address: {i.ipAllocations[0]?.macAddress}</p>
              <p>Gateway: {i.ipAllocations[0]?.gateway}</p>
              <p>VMID: {i.pveVmid}</p>
              <p>Status: {i.status}</p>
            </div>
          )
        })
      )}

      <div className="mt-4 flex flex-col gap-2">
        {session?.session ? (
          <Link
            className="flex items-center gap-0.5 text-blue-500 hover:underline"
            href="/dashboard"
          >
            Dashboard <IconArrowRight className="inline-block size-4" />
          </Link>
        ) : (
          <Link
            className="flex items-center gap-0.5 text-blue-500 hover:underline"
            href="/auth/sign-in"
          >
            Sign In <IconArrowRight className="inline-block size-4" />
          </Link>
        )}
      </div>
    </main>
  )
}
