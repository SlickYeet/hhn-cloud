ALTER TYPE "public"."activity_reference_type" ADD VALUE 'ssh_key' BEFORE 'user';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'ssh_key_created' BEFORE 'user_logged_in';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'ssh_key_updated' BEFORE 'user_logged_in';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'ssh_key_deleted' BEFORE 'user_logged_in';