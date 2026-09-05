ALTER TYPE "public"."instance_status" ADD VALUE 'starting' BEFORE 'running';--> statement-breakpoint
ALTER TYPE "public"."instance_status" ADD VALUE 'stopping' BEFORE 'stopped';