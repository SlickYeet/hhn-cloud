import { relations } from "drizzle-orm"
import { index, pgEnum, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { env } from "@/env"

export const createTable = pgTableCreator((name) => `cloud_${name}`)

export const sshKeyTable = createTable(
  "ssh_key",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    fingerprint: d.text("fingerprint").notNull(),
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
  }),
  (t) => [
    index("ssh_key_organizationId_idx").on(t.organizationId),
    uniqueIndex("ssh_key_name_idx").on(t.organizationId, t.name),
  ],
)

export type SshKey = typeof sshKeyTable.$inferInsert
export const insertSshKeySchema = createInsertSchema(sshKeyTable, {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})
export const selectSshKeySchema = createSelectSchema(sshKeyTable)

export const templateStatusEnum = pgEnum("template_status", [
  "active",
  "inactive",
  "deleted",
])

export const templateTable = createTable(
  "template",
  (d) => ({
    cloudInitEnabled: d.boolean("cloud_init_enabled").default(false).notNull(),
    cores: d.integer("cores").notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    description: d.text("description"),
    disk: d.integer("disk").notNull(),
    id: d.text("id").primaryKey(),
    memory: d.integer("memory").notNull(),
    name: d.text("name").unique().notNull(),
    os: d.text("os").notNull(),
    pveVmid: d.integer("pve_vmid").unique().notNull(),
    status: templateStatusEnum("status").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    version: d.text("version").notNull(),
  }),
  (t) => [
    index("template_name_idx").on(t.name),
    index("template_pveVmid_idx").on(t.pveVmid),
    index("template_description_idx").on(t.description),
  ],
)

export type Template = typeof templateTable.$inferInsert
export const insertTemplateSchema = createInsertSchema(templateTable, {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})
export const selectTemplateSchema = createSelectSchema(templateTable)

export const instanceStatusEnum = pgEnum("instance_status", [
  "queued",
  "provisioning",
  "running",
  "stopped",
  "restarting",
  "deleting",
  "deleted",
  "failed",
])

export const instanceTable = createTable(
  "instance",
  (d) => ({
    cores: d.integer("cores").notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    deletedAt: d.timestamp("deleted_at"),
    disk: d.integer("disk").notNull(),
    hostname: d.text("hostname").notNull(),
    id: d.text("id").primaryKey(),
    memory: d.integer("memory").notNull(),
    networkId: d
      .text("network_id")
      .notNull()
      .references(() => networkTable.id, { onDelete: "cascade" }),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pveNode: d.text("pve_node").notNull(),
    pveVmid: d.integer("pve_vmid").unique().notNull(),
    rootPassword: d.text("root_password").notNull(),
    status: instanceStatusEnum("status").notNull(),
    templateId: d
      .integer("template_id")
      .notNull()
      .references(() => templateTable.pveVmid, { onDelete: "restrict" }),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("instance_hostname_idx").on(t.hostname),
    index("instance_organizationId_idx").on(t.organizationId),
    index("instance_pveNode_idx").on(t.pveNode),
    index("instance_pveVmid_idx").on(t.pveVmid),
  ],
)

export type Instance = typeof instanceTable.$inferInsert
export const insertInstanceSchema = createInsertSchema(instanceTable, {
  cores: z.int().min(1).max(64),
  createdAt: z.coerce.date().optional(),
  disk: z.int().min(1).max(1024),
  memory: z
    .number()
    .int()
    .min(512)
    .max(1024 * 64),
  templateId: z
    .number()
    .int()
    .min(env.PROXMOX_TEMPLATE_VMID_RANGE[0])
    .max(env.PROXMOX_TEMPLATE_VMID_RANGE[1]),
  updatedAt: z.coerce.date().optional(),
})
export const selectInstanceSchema = createSelectSchema(instanceTable)

export const instanceSshKeyTable = createTable(
  "instance_ssh_key",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    instanceId: d
      .text("instance_id")
      .notNull()
      .references(() => instanceTable.id, { onDelete: "cascade" }),
    sshKeyId: d
      .text("ssh_key_id")
      .notNull()
      .references(() => sshKeyTable.id, { onDelete: "cascade" }),
  }),
  (t) => [
    index("instance_ssh_key_instanceId_idx").on(t.instanceId),
    index("instance_ssh_key_sshKeyId_idx").on(t.sshKeyId),
    uniqueIndex("instance_ssh_key_unique_idx").on(t.instanceId, t.sshKeyId),
  ],
)

export type InstanceSshKey = typeof instanceSshKeyTable.$inferInsert
export const insertInstanceSshKeySchema = createInsertSchema(
  instanceSshKeyTable,
  {
    createdAt: z.coerce.date().optional(),
  },
)
export const selectInstanceSshKeySchema =
  createSelectSchema(instanceSshKeyTable)

export const ipAllocationStatusEnum = pgEnum("ip_allocation_status", [
  "allocated",
  "available",
  "unavailable",
])

export const ipAllocationTable = createTable(
  "ip_allocation",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    instanceId: d
      .text("instance_id")
      .references(() => instanceTable.id, { onDelete: "set null" }),
    ipAddress: d.inet("ip_address").unique().notNull(),
    macAddress: d.macaddr("mac_address").unique(),
    networkId: d
      .text("network_id")
      .notNull()
      .references(() => networkTable.id, { onDelete: "restrict" }),
    status: ipAllocationStatusEnum("status").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [index("ip_allocation_ipAddress_idx").on(t.ipAddress)],
)

export type IpAllocation = typeof ipAllocationTable.$inferInsert
export const insertIpAllocationSchema = createInsertSchema(ipAllocationTable, {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})
export const selectIpAllocationSchema = createSelectSchema(ipAllocationTable)

export const networkTable = createTable("network", (d) => ({
  cidr: d.integer("cidr").default(24).notNull(),
  createdAt: d.timestamp("created_at").defaultNow().notNull(),
  dhcpEnabled: d.boolean("dhcp_enabled").default(true).notNull(),
  dnsServers: d.text("dns_servers").array().notNull(),
  gateway: d.inet("gateway").notNull(),
  id: d.text("id").primaryKey(),
  name: d.text("name").unique().notNull(),
  network: d.inet("network").unique().notNull(),
  updatedAt: d
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  vlanId: d.integer("vlan_id").unique().notNull(),
}))

export type Network = typeof networkTable.$inferInsert
export const insertNetworkSchema = createInsertSchema(networkTable, {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})
export const selectNetworkSchema = createSelectSchema(networkTable)

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
  createdAt: d.timestamp("created_at").defaultNow().notNull(),
  id: d.text("id").primaryKey(),
  logo: d.text("logo"),
  metadata: d.text("metadata"),
  name: d.text("name").notNull(),
  slug: d.text("slug").notNull().unique(),
}))

export const member = createTable(
  "member",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
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

export const sshKeyRelations = relations(sshKeyTable, ({ one, many }) => ({
  instanceSshKeys: many(instanceSshKeyTable),
  organization: one(organization, {
    fields: [sshKeyTable.organizationId],
    references: [organization.id],
  }),
}))

export const instanceRelations = relations(instanceTable, ({ one, many }) => ({
  instanceSshKeys: many(instanceSshKeyTable),
  ipAllocations: many(ipAllocationTable),
  network: one(networkTable, {
    fields: [instanceTable.networkId],
    references: [networkTable.id],
  }),
  organization: one(organization, {
    fields: [instanceTable.organizationId],
    references: [organization.id],
  }),
  template: one(templateTable, {
    fields: [instanceTable.templateId],
    references: [templateTable.id],
  }),
}))

export const instanceSshKeyRelations = relations(
  instanceSshKeyTable,
  ({ one }) => ({
    instance: one(instanceTable, {
      fields: [instanceSshKeyTable.instanceId],
      references: [instanceTable.id],
    }),
    sshKey: one(sshKeyTable, {
      fields: [instanceSshKeyTable.sshKeyId],
      references: [sshKeyTable.id],
    }),
  }),
)

export const templateRelations = relations(templateTable, ({ many }) => ({
  instances: many(instanceTable),
}))

export const ipAllocationRelations = relations(
  ipAllocationTable,
  ({ one }) => ({
    instance: one(instanceTable, {
      fields: [ipAllocationTable.instanceId],
      references: [instanceTable.id],
    }),
    network: one(networkTable, {
      fields: [ipAllocationTable.networkId],
      references: [networkTable.id],
    }),
  }),
)

export const networkRelations = relations(networkTable, ({ many }) => ({
  instances: many(instanceTable),
  ipAllocations: many(ipAllocationTable),
}))
