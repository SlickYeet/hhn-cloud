CREATE TYPE "public"."ssh_key_type" AS ENUM('rsa', 'ed25519');--> statement-breakpoint
ALTER TABLE "ssh_key" ADD COLUMN "type" "ssh_key_type";--> statement-breakpoint
UPDATE "ssh_key" SET "type" = 'ed25519';--> statement-breakpoint
ALTER TABLE "ssh_key" ALTER COLUMN "type" SET NOT NULL;