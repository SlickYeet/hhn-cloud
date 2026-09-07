CREATE TYPE "public"."activity_actor" AS ENUM('system', 'user', 'external');--> statement-breakpoint
CREATE TYPE "public"."activity_channel" AS ENUM('dashboard', 'api', 'worker');--> statement-breakpoint
CREATE TYPE "public"."activity_reference_type" AS ENUM('instance', 'user');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('instance_provisioning', 'instance_created', 'instance_started', 'instance_stopped', 'instance_deleted', 'instance_updated', 'user_logged_in', 'user_logged_out', 'user_updated', 'user_deleted');--> statement-breakpoint
CREATE TABLE "activity" (
	"actor_id" text,
	"actor_type" "activity_actor" NOT NULL,
	"channel" "activity_channel" NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata" jsonb,
	"organization_id" text NOT NULL,
	"reference_id" text NOT NULL,
	"reference_type" "activity_reference_type" NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"type" "activity_type" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;