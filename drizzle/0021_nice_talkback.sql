ALTER TABLE "instance_firewall_rule" ALTER COLUMN "source_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."firewall_rule_source_type";--> statement-breakpoint
CREATE TYPE "public"."firewall_rule_source_type" AS ENUM('cidr', 'org', 'any');--> statement-breakpoint
ALTER TABLE "instance_firewall_rule" ALTER COLUMN "source_type" SET DATA TYPE "public"."firewall_rule_source_type" USING "source_type"::"public"."firewall_rule_source_type";--> statement-breakpoint
ALTER TABLE "instance_firewall_rule" ADD CONSTRAINT "source_cidr_matches_source_type" CHECK (("instance_firewall_rule"."source_type" = 'cidr' AND "instance_firewall_rule"."source_cidr" IS NOT NULL) OR ("instance_firewall_rule"."source_type" != 'cidr' AND "instance_firewall_rule"."source_cidr" IS NULL));