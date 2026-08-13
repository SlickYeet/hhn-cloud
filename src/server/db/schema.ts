import { relations } from "drizzle-orm"
import { index, pgEnum, pgTableCreator } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

export const createTable = pgTableCreator((name) => `cloud_${name}`)

export const sshKeyTable = createTable("ssh_key", (d) => ({
  createdAt: d.timestamp("created_at").defaultNow().notNull(),
  id: d.text("id").primaryKey(),
  name: d.text("name").notNull(),
  organizationId: d
    .text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  publicKey: d.text("public_key").notNull(),
  updatedAt: d
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
}))

export const templateTable = createTable(
  "template",
  (d) => ({
    cpu: d.integer().notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    description: d.text(),
    disk: d.integer().notNull(),
    id: d.text().primaryKey(),
    memory: d.integer().notNull(),
    name: d.text().notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
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
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    ipAddress: d.text("ip_address").notNull(),
    macAddress: d.text("mac_address").notNull(),
    name: d.text("name").notNull(),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pveNode: d.text("pve_node").notNull(),
    pveVmid: d.integer("pve_vmid").notNull(),
    status: instanceStatusEnum("status").notNull(),
    templateId: d
      .text("template_id")
      .notNull()
      .references(() => templateTable.id, { onDelete: "cascade" }),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("instance_name_idx").on(t.name),
    index("instance_ipAddress_idx").on(t.ipAddress),
    index("instance_macAddress_idx").on(t.macAddress),
    index("instance_pveNode_idx").on(t.pveNode),
    index("instance_pveVmid_idx").on(t.pveVmid),
  ],
)

const timestampInputSchema = z.coerce.date()

export type Instance = typeof instanceTable.$inferInsert
export const insertInstanceSchema = createInsertSchema(instanceTable, {
  createdAt: timestampInputSchema.optional(),
  updatedAt: timestampInputSchema.optional(),
})
export const selectInstanceSchema = createSelectSchema(instanceTable)

export const ipAllocationStatusEnum = pgEnum("ip_allocation_status", [
  "allocated",
  "available",
  "reserved",
])

export const ipAllocationTable = createTable(
  "ip_allocation",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    instanceId: d
      .text("instance_id")
      .references(() => instanceTable.id, { onDelete: "cascade" }),
    ipAddress: d.text("ip_address").notNull(),
    network: d.text("network").notNull(),
    status: ipAllocationStatusEnum("status").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("ip_allocation_ipAddress_idx").on(t.ipAddress),
    index("ip_allocation_network_idx").on(t.network),
  ],
)

export const user = createTable(
  "user",
  (d) => ({
    banExpires: d.timestamp("ban_expires"),
    banned: d.boolean("banned").default(false),
    banReason: d.text("ban_reason"),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    email: d.text("email").notNull().unique(),
    emailVerified: d.boolean("email_verified").default(false).notNull(),
    id: d.text("id").primaryKey(),
    image: d.text("image"),
    name: d.text("name").notNull(),
    role: d.text("role"),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("user_name_idx").on(t.name),
    index("user_email_idx").on(t.email),
  ],
)

export const session = createTable(
  "session",
  (d) => ({
    activeOrganizationId: d.text("active_organization_id"),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    expiresAt: d.timestamp("expires_at").notNull(),
    id: d.text("id").primaryKey(),
    impersonatedBy: d.text("impersonated_by"),
    ipAddress: d.text("ip_address"),
    token: d.text("token").notNull().unique(),
    updatedAt: d
      .timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
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
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    idToken: d.text("id_token"),
    password: d.text("password"),
    providerId: d.text("provider_id").notNull(),
    refreshToken: d.text("refresh_token"),
    refreshTokenExpiresAt: d.timestamp("refresh_token_expires_at"),
    scope: d.text("scope"),
    updatedAt: d
      .timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
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
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    expiresAt: d.timestamp("expires_at").notNull(),
    id: d.text("id").primaryKey(),
    identifier: d.text("identifier").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    value: d.text("value").notNull(),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
)

export const organization = createTable("organization", (d) => ({
  createdAt: d.timestamp("created_at").notNull(),
  id: d.text("id").primaryKey(),
  logo: d.text("logo"),
  metadata: d.text("metadata"),
  name: d.text("name").notNull(),
  slug: d.text("slug").notNull().unique(),
}))

export const member = createTable(
  "member",
  (d) => ({
    createdAt: d.timestamp("created_at").notNull(),
    id: d.text("id").primaryKey(),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: d.text("role").default("member").notNull(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [
    index("member_organizationId_idx").on(t.organizationId),
    index("member_userId_idx").on(t.userId),
  ],
)

export const invitation = createTable(
  "invitation",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    email: d.text("email").notNull(),
    expiresAt: d.timestamp("expires_at").notNull(),
    id: d.text("id").primaryKey(),
    inviterId: d
      .text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: d.text("role"),
    status: d.text("status").default("pending").notNull(),
  }),
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  invitations: many(invitation),
  members: many(member),
  sessions: many(session),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const organizationRelations = relations(organization, ({ many }) => ({
  invitations: many(invitation),
  members: many(member),
}))

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}))

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}))
