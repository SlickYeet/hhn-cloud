import { sql } from "drizzle-orm"
import { index, pgTableCreator } from "drizzle-orm/pg-core"

export const createTable = pgTableCreator((name) => `cloud_${name}`)

export const user = createTable(
  "user",
  (d) => ({
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    email: d.text().notNull().unique(),
    emailVerified: d
      .boolean()
      .$defaultFn(() => false)
      .notNull(),
    id: d.text().primaryKey(),
    image: d.text(),
    name: d.text().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("user_name_idx").on(t.name),
    index("user_email_idx").on(t.email),
  ],
)

export const session = createTable(
  "session",
  (d) => ({
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expiresAt: d.timestamp().notNull(),
    id: d.text().primaryKey(),
    ipAddress: d.text(),
    token: d.text().notNull().unique(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    userAgent: d.text(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [index("session_userId_idx").on(t.userId)],
)

export const account = createTable(
  "account",
  (d) => ({
    accessToken: d.text(),
    accessTokenExpiresAt: d.timestamp(),
    accountId: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    id: d.text().primaryKey(),
    idToken: d.text(),
    password: d.text(),
    providerId: d.text().notNull(),
    refreshToken: d.text(),
    refreshTokenExpiresAt: d.timestamp(),
    scope: d.text(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [index("account_userId_idx").on(t.userId)],
)

export const verification = createTable(
  "verification",
  (d) => ({
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expiresAt: d.timestamp().notNull(),
    id: d.text().primaryKey(),
    identifier: d.text().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    value: d.text().notNull(),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
)
