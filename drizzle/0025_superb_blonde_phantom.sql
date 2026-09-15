ALTER TABLE "activity" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "actor_snapshot" jsonb;--> statement-breakpoint
DROP TYPE "public"."activity_type";