import { reset } from "drizzle-seed"

import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import * as schema from "@/server/db/schema"

async function main() {
  const redis = getRedisClient()

  console.info("Resetting database...")
  await reset(db, schema)
  await redis.flushAll()
}

main()
  .then(() => {
    console.info("Database reset successfully.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Failed to reset database:", error)
    process.exit(1)
  })
