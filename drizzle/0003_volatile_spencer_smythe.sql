CREATE TYPE "public"."resource_plan_status" AS ENUM('active', 'inactive', 'deleted');--> statement-breakpoint
CREATE TABLE "resource_plan" (
	"cores" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"disk" integer NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"memory" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "resource_plan_status" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resource_plan_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "instance" ADD COLUMN "resource_plan_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "resource_plan_slug_idx" ON "resource_plan" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "instance" ADD CONSTRAINT "instance_resource_plan_id_resource_plan_id_fk" FOREIGN KEY ("resource_plan_id") REFERENCES "public"."resource_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "instance_resourcePlanId_idx" ON "instance" USING btree ("resource_plan_id");