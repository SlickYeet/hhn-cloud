import { relations } from "drizzle-orm"
import {
  foreignKey,
  index,
  pgEnum,
  pgTableCreator,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const createTable = pgTableCreator((name) => name)

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

export const operatingSystemCategoryTable = createTable(
  "operating_system_category",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    name: d.text("name").unique().notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }),
)

export const operatingSystemReleaseTable = createTable(
  "operating_system_release",
  (d) => ({
    categoryId: d.text("category_id").notNull(),
    codename: d.text("codename"), // e.g., "Resolute Raccoon", "Bookworm"
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    family: d.text("family").notNull(), // e.g., "Ubuntu", "Debian"
    id: d.text("id").primaryKey(),
    isLts: d.boolean("is_lts").default(false).notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    version: d.text("version").notNull(), // e.g., "26.04", "12"
  }),
  (t) => [
    index("os_release_category_idx").on(t.categoryId),
    index("os_release_family_version_idx").on(t.family, t.version),
    unique("os_release_family_version_uniq").on(t.family, t.version),
    foreignKey({
      columns: [t.categoryId],
      foreignColumns: [operatingSystemCategoryTable.id],
      name: "os_release_category_fk",
    }),
  ],
)

export const operatingSystemStatusEnum = pgEnum("operating_system_status", [
  "active",
  "inactive",
  "deleted",
])

export const operatingSystemTable = createTable(
  "operating_system",
  (d) => ({
    cloudInitEnabled: d.boolean("cloud_init_enabled").default(false).notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    name: d.text("name").notNull(), // e.g., "Ubuntu 26.04 LTS", "Debian 12"
    pveVmid: d.integer("pve_vmid").unique().notNull(),
    releaseId: d.text("release_id").notNull(),
    slug: d.text("slug").unique().notNull(),
    status: operatingSystemStatusEnum("status").notNull(),
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("operating_system_name_idx").on(t.name),
    index("operating_system_release_idx").on(t.releaseId),
    index("operating_system_pveVmid_idx").on(t.pveVmid),
    foreignKey({
      columns: [t.releaseId],
      foreignColumns: [operatingSystemReleaseTable.id],
      name: "os_release_fk",
    }).onDelete("restrict"),
  ],
)

export const instanceStatusEnum = pgEnum("instance_status", [
  "queued",
  "provisioning",
  "running",
  "stopped",
  "restarting",
  "pending_deletion",
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
    operatingSystemId: d
      .text("operating_system_id")
      .notNull()
      .references(() => operatingSystemTable.id, { onDelete: "restrict" }),
    organizationId: d
      .text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pveNode: d.text("pve_node").notNull(),
    pveVmid: d.integer("pve_vmid").unique().notNull(),
    rootPassword: d.text("root_password").notNull(),
    status: instanceStatusEnum("status").notNull(),
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

export const ipAllocationTable = createTable(
  "ip_allocation",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    gateway: d.inet("gateway").notNull(),
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
    updatedAt: d
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [index("ip_allocation_ipAddress_idx").on(t.ipAddress)],
)

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

export const user = createTable(
  "user",
  (d) => ({
    banExpires: d.timestamp("ban_expires"),
    banned: d.boolean("banned").default(false),
    banReason: d.text("ban_reason"),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    defaultOrganizationId: d
      .text("default_organization_id")
      .references(() => organization.id, { onDelete: "set null" }),
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
    index("user_defaultOrganizationId_idx").on(t.defaultOrganizationId),
  ],
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
    issuer: d.text("issuer").notNull(),
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

export const organization = createTable(
  "organization",
  (d) => ({
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    id: d.text("id").primaryKey(),
    logo: d.text("logo"),
    metadata: d.text("metadata"),
    name: d.text("name").notNull(),
    slug: d.text("slug").notNull().unique(),
  }),
  (t) => [index("organization_slug_uidx").on(t.slug)],
)

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

export const apikey = createTable(
  "apikey",
  (d) => ({
    configId: d.text("config_id").default("default").notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    enabled: d.boolean("enabled").default(true),
    expiresAt: d.timestamp("expires_at"),
    id: d.text("id").primaryKey(),
    key: d.text("key").notNull(),
    lastRefillAt: d.timestamp("last_refill_at"),
    lastRequest: d.timestamp("last_request"),
    metadata: d.text("metadata"),
    name: d.text("name"),
    permissions: d.text("permissions"),
    prefix: d.text("prefix"),
    rateLimitEnabled: d.boolean("rate_limit_enabled").default(true),
    rateLimitMax: d.integer("rate_limit_max").default(10),
    rateLimitTimeWindow: d.integer("rate_limit_time_window").default(86400000),
    referenceId: d.text("reference_id").notNull(),
    refillAmount: d.integer("refill_amount"),
    refillInterval: d.integer("refill_interval"),
    remaining: d.integer("remaining"),
    requestCount: d.integer("request_count").default(0),
    start: d.text("start"),
    updatedAt: d.timestamp("updated_at").notNull(),
  }),
  (t) => [
    index("apikey_configId_idx").on(t.configId),
    index("apikey_referenceId_idx").on(t.referenceId),
    index("apikey_key_idx").on(t.key),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  invitations: many(invitation),
  members: many(member),
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
  operatingSystem: one(operatingSystemTable, {
    fields: [instanceTable.operatingSystemId],
    references: [operatingSystemTable.id],
  }),
  organization: one(organization, {
    fields: [instanceTable.organizationId],
    references: [organization.id],
  }),
  sshKeys: many(instanceSshKeyTable),
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

export const operatingSystemCategoryRelations = relations(
  operatingSystemCategoryTable,
  ({ many }) => ({
    releases: many(operatingSystemReleaseTable),
  }),
)

export const operatingSystemReleaseRelations = relations(
  operatingSystemReleaseTable,
  ({ one, many }) => ({
    category: one(operatingSystemCategoryTable, {
      fields: [operatingSystemReleaseTable.categoryId],
      references: [operatingSystemCategoryTable.id],
    }),
    operatingSystems: many(operatingSystemTable),
  }),
)

export const operatingSystemRelations = relations(
  operatingSystemTable,
  ({ one }) => ({
    release: one(operatingSystemReleaseTable, {
      fields: [operatingSystemTable.releaseId],
      references: [operatingSystemReleaseTable.id],
    }),
  }),
)

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
