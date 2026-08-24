"use client"

import type { ApiKey } from "@better-auth/api-key"
import * as React from "react"

import { authClient } from "@/lib/auth/client"

export function APIKey() {
  const [apiKeys, setApiKeys] = React.useState<ApiKey[] | null>(null)
  const [error, setError] = React.useState<string | undefined>(undefined)

  async function createApiKey() {
    const { data: org } = await authClient.organization.list()

    const { data, error } = await authClient.apiKey.create({
      configId: "org-keys",
      expiresIn: null,
      name: "My API Key",
      organizationId: org?.[0]?.id,
    })
    if (data) setApiKeys([data])
    if (error) setError(error.message)
  }

  React.useEffect(() => {
    async function fetchApiKey() {
      const { data: org } = await authClient.organization.list()

      const { data } = await authClient.apiKey.list({
        query: { organizationId: org?.[0]?.id },
      })
      if (data) setApiKeys(data.apiKeys as ApiKey[])
    }
    fetchApiKey()
  }, [])

  function copyToClipboard(id: string) {
    if (apiKeys && apiKeys.length > 0) {
      const apiKey = apiKeys.find((key) => key.id === id)
      if (apiKey) {
        navigator.clipboard.writeText(apiKey.key)
        alert("Copied to clipboard!")
      }
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
      {error && <p className="text-red-500">{error}</p>}
      <div className="mt-4">
        <p>
          <span className="font-bold">API Keys:</span>{" "}
          {apiKeys?.length === 0 && "No API keys found."}
        </p>
        {apiKeys && apiKeys.length > 0 && (
          <ul className="mt-2">
            {apiKeys.map((key) => (
              <li className="flex items-center gap-2" key={key.id}>
                <span>{key.name}</span>
                <button
                  className="rounded bg-green-600 px-2 py-1 text-white hover:bg-green-700"
                  onClick={() => copyToClipboard(key.id)}
                  type="button"
                >
                  Copy
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
