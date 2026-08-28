ALTER TABLE "operating_system" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."operating_system_status";--> statement-breakpoint
CREATE TYPE "public"."operating_system_status" AS ENUM('active', 'inactive', 'deprecated');--> statement-breakpoint
ALTER TABLE "operating_system" ALTER COLUMN "status" SET DATA TYPE "public"."operating_system_status" USING "status"::"public"."operating_system_status";--> statement-breakpoint
ALTER TABLE "resource_plan" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."resource_plan_status";--> statement-breakpoint
CREATE TYPE "public"."resource_plan_status" AS ENUM('active', 'inactive', 'deprecated');--> statement-breakpoint
ALTER TABLE "resource_plan" ALTER COLUMN "status" SET DATA TYPE "public"."resource_plan_status" USING "status"::"public"."resource_plan_status";