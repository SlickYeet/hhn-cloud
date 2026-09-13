ALTER TABLE "instance" ALTER COLUMN "firewall_sync_status" SET DEFAULT 'synced';--> statement-breakpoint
ALTER TABLE "instance" ADD COLUMN "firewall_sync_error" text;