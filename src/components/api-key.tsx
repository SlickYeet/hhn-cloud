"use client"

import type { ApiKey } from "@better-auth/api-key"
import * as React from "react"

import { authClient } from "@/lib/auth/client"

export function APIKey() {
  const [apiKey, setApiKey] = React.useState<ApiKey | null>(null)

  async function createApiKey() {
    const { data } = await authClient.apiKey.create({
      configId: "default",
      expiresIn: null,
      name: "My API Key",
      organizationId: "org1",
    })

    if (data) setApiKey(data)
  }

  function copyToClipboard() {
    if (apiKey?.key) {
      navigator.clipboard.writeText(apiKey.key).then(() => {
        alert("Copied to clipboard!")
      })
    }
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <button
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        onClick={createApiKey}
        type="button"
      >
        Create API Key
      </button>

      <div className="mt-4">
        <p className="font-bold">
          API Key:{" "}
          <button
            className="cursor-copy break-all"
            onClick={copyToClipboard}
            type="button"
          >
            {apiKey?.key || "No API Key"}
          </button>
        </p>
      </div>
    </div>
  )
}
