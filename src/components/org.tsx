"use client"

import type { Session } from "better-auth"
import type { Organization } from "better-auth/plugins"
import * as React from "react"

import { authClient } from "@/lib/auth/client"

export function Org({ session }: { session: Session }) {
  const [orgs, setOrgs] = React.useState<Organization[] | null>(null)

  async function createOrg() {
    const { data: orgs } = await authClient.organization.list()
    if (orgs && orgs.length > 0) {
      alert("You already have an org!")
      return
    }

    const { data } = await authClient.organization.create({
      name: "My Organization",
      slug: "my-org",
      userId: session.userId,
    })
    if (data) setOrgs([data])
  }

  React.useEffect(() => {
    async function getOrg() {
      const { data } = await authClient.organization.list()
      setOrgs(data)
    }
    getOrg()
  }, [])

  return (
    <div className="mt-4">
      <p>
        <span className="font-bold">Organization:</span>{" "}
        {orgs?.[0]?.name || "No organization found."}
      </p>
      {orgs && orgs.length === 0 && (
        <button
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={createOrg}
          type="button"
        >
          Create Organization
        </button>
      )}
    </div>
  )
}
