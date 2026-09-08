import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type postgres from "postgres"

export type DB = PostgresJsDatabase<typeof import("@/server/db/schema")> & {
  $client: postgres.Sql<Record<string, never>>
}

export function isUniqueConstraintError(
  error: unknown,
  constraintName: string,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "constraint_name" in error &&
    error.constraint_name === constraintName
  )
}
