CREATE TYPE "public"."firewall_rule_action" AS ENUM('ACCEPT', 'DROP');--> statement-breakpoint
CREATE TYPE "public"."firewall_rule_protocol" AS ENUM('tcp', 'udp', 'icmp', 'any');--> statement-breakpoint
CREATE TYPE "public"."firewall_rule_source_type" AS ENUM('cidr', 'self', 'any');--> statement-breakpoint
CREATE TABLE "instance_firewall_rule" (
	"action" "firewall_rule_action" NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"port_range" text,
	"priority" integer NOT NULL,
	"protocol" "firewall_rule_protocol" NOT NULL,
	"source_cidr" text,
	"source_type" "firewall_rule_source_type" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instance_firewall_rule" ADD CONSTRAINT "instance_firewall_rule_instance_id_instance_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."instance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "instance_firewall_rule_instanceId_idx" ON "instance_firewall_rule" USING btree ("instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "firewall_rule_instanceId_priority_idx" ON "instance_firewall_rule" USING btree ("instance_id","priority");