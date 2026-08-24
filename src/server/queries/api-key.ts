import type { ApiKey } from "@better-auth/api-key"

import { GLOBAL_API_KEY_CONFIG_ID } from "@/constants/auth"
import { auth } from "@/server/auth"

export async function getApiKeyFromHeaders(
  headers: Headers,
  throwError = true,
): Promise<{ apiKey: Omit<ApiKey, "key"> | null }> {
  const apiKey = headers.get("x-api-key")
  const { key } = apiKey
    ? await auth.api.verifyApiKey({
        body: {
          configId: GLOBAL_API_KEY_CONFIG_ID,
          key: apiKey || "",
        },
      })
    : { key: null }

  if (throwError && !key) {
    throw new Error("Invalid API key")
  }

  return { apiKey: key }
}
