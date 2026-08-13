import { sql } from "drizzle-orm"
import { index, pgEnum, pgTableCreator } from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"

export const createTable = pgTableCreator((name) => `cloud_${name}`)

export const templateTable = createTable(
  "template",
  (d) => ({
    cpu: d.integer().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    description: d.text(),
    disk: d.integer().notNull(),
    id: d.text().primaryKey(),
    memory: d.integer().notNull(),
    name: d.text().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("template_name_idx").on(t.name),
    index("template_description_idx").on(t.description),
  ],
)

export const instanceStatusEnum = pgEnum("status", [
  "queued",
  "provisioning",
  "running",
  "failed",
  "deleting",
  "deleted",
])

export const instanceTable = createTable(
  "instance",
  (d) => ({
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    id: d.text("id").primaryKey(),
    ipAddress: d.text("ip_address").notNull(),
    macAddress: d.text("mac_address").notNull(),
    name: d.text("name").notNull(),
    pveNode: d.text("pve_node").notNull(),
    pveVmid: d.integer("pve_vmid").notNull(),
    status: instanceStatusEnum("status").notNull(),
    templateId: d
      .text("template_id")
      .notNull()
      .references(() => templateTable.id, { onDelete: "cascade" }),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("instance_name_idx").on(t.name),
    index("instance_ipAddress_idx").on(t.ipAddress),
    index("instance_macAddress_idx").on(t.macAddress),
    index("instance_pveNode_idx").on(t.pveNode),
    index("instance_pveVmid_idx").on(t.pveVmid),
  ],
)

export type Instance = typeof instanceTable.$inferInsert
export const selectInstanceSchema = createSelectSchema(instanceTable)

export const ipAllocationStatusEnum = pgEnum("ip_allocation_status", [
  "allocated",
  "available",
  "reserved",
])

export const ipAllocationTable = createTable(
  "ip_allocation",
  (d) => ({
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    id: d.text("id").primaryKey(),
    instanceId: d
      .text("instance_id")
      .references(() => instanceTable.id, { onDelete: "cascade" }),
    ipAddress: d.text("ip_address").notNull(),
    network: d.text("network").notNull(),
    status: ipAllocationStatusEnum("status").notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("ip_allocation_ipAddress_idx").on(t.ipAddress),
    index("ip_allocation_network_idx").on(t.network),
  ],
)

export const user = createTable(
  "user",
  (d) => ({
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    email: d.text("email").notNull().unique(),
    emailVerified: d
      .boolean()
      .$defaultFn(() => false)
      .notNull(),
    id: d.text("id").primaryKey(),
    image: d.text("image"),
    name: d.text("name").notNull(),
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
    expiresAt: d.timestamp("expires_at").notNull(),
    id: d.text("id").primaryKey(),
    ipAddress: d.text("ip_address"),
    token: d.text("token").notNull().unique(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    userAgent: d.text("user_agent"),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [index("session_userId_idx").on(t.userId)],
)

export const account = createTable(
  "account",
  (d) => ({
    accessToken: d.text("access_token"),
    accessTokenExpiresAt: d.timestamp("access_token_expires_at"),
    accountId: d.text("account_id").notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    id: d.text("id").primaryKey(),
    idToken: d.text("id_token"),
    password: d.text("password"),
    providerId: d.text("provider_id").notNull(),
    refreshToken: d.text("refresh_token"),
    refreshTokenExpiresAt: d.timestamp("refresh_token_expires_at"),
    scope: d.text("scope"),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    userId: d
      .text("user_id")
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
    expiresAt: d.timestamp("expires_at").notNull(),
    id: d.text("id").primaryKey(),
    identifier: d.text("identifier").notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    value: d.text("value").notNull(),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
)
