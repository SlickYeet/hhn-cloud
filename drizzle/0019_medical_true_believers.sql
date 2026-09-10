ALTER TYPE "public"."activity_type" ADD VALUE 'instance_power_action_requested' BEFORE 'instance_started';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'instance_power_action_completed' BEFORE 'instance_started';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'instance_power_action_failed' BEFORE 'instance_started';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'instance_deletion_requested' BEFORE 'instance_deleted';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'instance_deletion_failed' BEFORE 'instance_deleted';