import { reset } from "drizzle-seed"

import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import * as schema from "@/server/db/schema"

async function main() {
  const redis = getRedisClient()

  try {
    console.info("Resetting database...")
    await reset(db, schema)
    await redis.flushAll()
  } catch (error) {
    console.error("Failed to reset database:", error)
    process.exit(1)
  }
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
