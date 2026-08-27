ALTER TABLE "operating_system" DROP CONSTRAINT "os_template_release_fk";
--> statement-breakpoint
ALTER TABLE "operating_system" ADD CONSTRAINT "os_release_fk" FOREIGN KEY ("release_id") REFERENCES "public"."operating_system_release"("id") ON DELETE restrict ON UPDATE no action;