ALTER TYPE "public"."template_status" RENAME TO "operating_system_status";--> statement-breakpoint
CREATE TABLE "operating_system_category" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operating_system_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "operating_system_release" (
	"category_id" text NOT NULL,
	"codename" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"family" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_lts" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" text NOT NULL,
	CONSTRAINT "os_release_family_version_uniq" UNIQUE("family","version")
);
--> statement-breakpoint
ALTER TABLE "template" RENAME TO "operating_system";--> statement-breakpoint
ALTER TABLE "instance" RENAME COLUMN "template_id" TO "operating_system_id";--> statement-breakpoint
ALTER TABLE "operating_system" DROP CONSTRAINT "template_name_unique";--> statement-breakpoint
ALTER TABLE "operating_system" DROP CONSTRAINT "template_pve_vmid_unique";--> statement-breakpoint
ALTER TABLE "operating_system" DROP CONSTRAINT "template_slug_unique";--> statement-breakpoint
ALTER TABLE "instance" DROP CONSTRAINT "instance_template_id_template_id_fk";
--> statement-breakpoint
DROP INDEX "template_name_idx";--> statement-breakpoint
DROP INDEX "template_pveVmid_idx";--> statement-breakpoint
DROP INDEX "template_description_idx";--> statement-breakpoint
ALTER TABLE "operating_system" ADD COLUMN "release_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "operating_system_release" ADD CONSTRAINT "os_release_category_fk" FOREIGN KEY ("category_id") REFERENCES "public"."operating_system_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "os_release_category_idx" ON "operating_system_release" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "os_release_family_version_idx" ON "operating_system_release" USING btree ("family","version");--> statement-breakpoint
ALTER TABLE "instance" ADD CONSTRAINT "instance_operating_system_id_operating_system_id_fk" FOREIGN KEY ("operating_system_id") REFERENCES "public"."operating_system"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_system" ADD CONSTRAINT "os_template_release_fk" FOREIGN KEY ("release_id") REFERENCES "public"."operating_system_release"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "operating_system_name_idx" ON "operating_system" USING btree ("name");--> statement-breakpoint
CREATE INDEX "operating_system_release_idx" ON "operating_system" USING btree ("release_id");--> statement-breakpoint
CREATE INDEX "operating_system_pveVmid_idx" ON "operating_system" USING btree ("pve_vmid");--> statement-breakpoint
ALTER TABLE "operating_system" DROP COLUMN "cores";--> statement-breakpoint
ALTER TABLE "operating_system" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "operating_system" DROP COLUMN "disk";--> statement-breakpoint
ALTER TABLE "operating_system" DROP COLUMN "memory";--> statement-breakpoint
ALTER TABLE "operating_system" DROP COLUMN "os";--> statement-breakpoint
ALTER TABLE "operating_system" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "operating_system" ADD CONSTRAINT "operating_system_pve_vmid_unique" UNIQUE("pve_vmid");--> statement-breakpoint
ALTER TABLE "operating_system" ADD CONSTRAINT "operating_system_slug_unique" UNIQUE("slug");