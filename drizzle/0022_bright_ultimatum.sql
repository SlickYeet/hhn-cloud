CREATE TYPE "public"."firewall_sync_status" AS ENUM('pending', 'synced', 'failed');--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'firewall_rule_created' BEFORE 'instance_provision_requested';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'firewall_sync_requested' BEFORE 'instance_provision_requested';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'firewall_sync_completed' BEFORE 'instance_provision_requested';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'firewall_sync_failed' BEFORE 'instance_provision_requested';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'firewall_rule_deleted' BEFORE 'instance_provision_requested';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'firewall_rule_reordered' BEFORE 'instance_provision_requested';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'firewall_rule_updated' BEFORE 'instance_provision_requested';--> statement-breakpoint
ALTER TABLE "activity" ALTER COLUMN "channel" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."activity_channel";--> statement-breakpoint
CREATE TYPE "public"."activity_channel" AS ENUM('api', 'worker');--> statement-breakpoint
ALTER TABLE "activity" ALTER COLUMN "channel" SET DATA TYPE "public"."activity_channel" USING "channel"::"public"."activity_channel";--> statement-breakpoint
ALTER TABLE "instance" ADD COLUMN "firewall_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "instance" ADD COLUMN "firewall_sync_status" "firewall_sync_status" DEFAULT 'pending' NOT NULL;