CREATE TYPE "public"."instance_status" AS ENUM('queued', 'provisioning', 'running', 'stopped', 'restarting', 'pending_deletion', 'deleting', 'deleted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('active', 'inactive', 'deleted');--> statement-breakpoint
CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"issuer" text NOT NULL,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"config_id" text DEFAULT 'default' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"enabled" boolean DEFAULT true,
	"expires_at" timestamp,
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"last_refill_at" timestamp,
	"last_request" timestamp,
	"metadata" text,
	"name" text,
	"permissions" text,
	"prefix" text,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_max" integer DEFAULT 10,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"reference_id" text NOT NULL,
	"refill_amount" integer,
	"refill_interval" integer,
	"remaining" integer,
	"request_count" integer DEFAULT 0,
	"start" text,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instance_ssh_key" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"ssh_key_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instance" (
	"cores" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"disk" integer NOT NULL,
	"hostname" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"memory" integer NOT NULL,
	"network_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"pve_node" text NOT NULL,
	"pve_vmid" integer NOT NULL,
	"root_password" text NOT NULL,
	"status" "instance_status" NOT NULL,
	"template_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instance_pve_vmid_unique" UNIQUE("pve_vmid")
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"inviter_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_allocation" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"gateway" "inet" NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text,
	"ip_address" "inet" NOT NULL,
	"mac_address" "macaddr",
	"network_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ip_allocation_ip_address_unique" UNIQUE("ip_address"),
	CONSTRAINT "ip_allocation_mac_address_unique" UNIQUE("mac_address")
);
--> statement-breakpoint
CREATE TABLE "member" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network" (
	"cidr" integer DEFAULT 24 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"dhcp_enabled" boolean DEFAULT true NOT NULL,
	"dns_servers" text[] NOT NULL,
	"gateway" "inet" NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"network" "inet" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"vlan_id" integer NOT NULL,
	CONSTRAINT "network_name_unique" UNIQUE("name"),
	CONSTRAINT "network_network_unique" UNIQUE("network"),
	CONSTRAINT "network_vlan_id_unique" UNIQUE("vlan_id")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"logo" text,
	"metadata" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ssh_key" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"fingerprint" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"public_key" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template" (
	"cloud_init_enabled" boolean DEFAULT false NOT NULL,
	"cores" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"disk" integer NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"memory" integer NOT NULL,
	"name" text NOT NULL,
	"os" text NOT NULL,
	"pve_vmid" integer NOT NULL,
	"slug" text NOT NULL,
	"status" "template_status" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" text NOT NULL,
	CONSTRAINT "template_name_unique" UNIQUE("name"),
	CONSTRAINT "template_pve_vmid_unique" UNIQUE("pve_vmid"),
	CONSTRAINT "template_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"ban_expires" timestamp,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"default_organization_id" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"role" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instance_ssh_key" ADD CONSTRAINT "instance_ssh_key_instance_id_instance_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."instance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instance_ssh_key" ADD CONSTRAINT "instance_ssh_key_ssh_key_id_ssh_key_id_fk" FOREIGN KEY ("ssh_key_id") REFERENCES "public"."ssh_key"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instance" ADD CONSTRAINT "instance_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instance" ADD CONSTRAINT "instance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instance" ADD CONSTRAINT "instance_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_allocation" ADD CONSTRAINT "ip_allocation_instance_id_instance_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."instance"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_allocation" ADD CONSTRAINT "ip_allocation_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ssh_key" ADD CONSTRAINT "ssh_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_default_organization_id_organization_id_fk" FOREIGN KEY ("default_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "apikey_configId_idx" ON "apikey" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "apikey_referenceId_idx" ON "apikey" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" USING btree ("key");--> statement-breakpoint
CREATE INDEX "instance_ssh_key_instanceId_idx" ON "instance_ssh_key" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "instance_ssh_key_sshKeyId_idx" ON "instance_ssh_key" USING btree ("ssh_key_id");--> statement-breakpoint
CREATE UNIQUE INDEX "instance_ssh_key_unique_idx" ON "instance_ssh_key" USING btree ("instance_id","ssh_key_id");--> statement-breakpoint
CREATE INDEX "instance_hostname_idx" ON "instance" USING btree ("hostname");--> statement-breakpoint
CREATE INDEX "instance_organizationId_idx" ON "instance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "instance_pveNode_idx" ON "instance" USING btree ("pve_node");--> statement-breakpoint
CREATE INDEX "instance_pveVmid_idx" ON "instance" USING btree ("pve_vmid");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "ip_allocation_ipAddress_idx" ON "ip_allocation" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_slug_uidx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ssh_key_organizationId_idx" ON "ssh_key" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ssh_key_name_idx" ON "ssh_key" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "template_name_idx" ON "template" USING btree ("name");--> statement-breakpoint
CREATE INDEX "template_pveVmid_idx" ON "template" USING btree ("pve_vmid");--> statement-breakpoint
CREATE INDEX "template_description_idx" ON "template" USING btree ("description");--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "user" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_defaultOrganizationId_idx" ON "user" USING btree ("default_organization_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");