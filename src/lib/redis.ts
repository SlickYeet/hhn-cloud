import { createClient } from "redis"

import { env } from "@/env"

let client: ReturnType<typeof createClient> | null = null

export function getRedisClient() {
  if (!client) {
    client = createClient({
      url: env.REDIS_URL,
    })
    client.connect().catch(console.error)
  }
  return client
}
