ALTER TABLE "operating_system_release" ALTER COLUMN "family" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."operating_system_family";--> statement-breakpoint
CREATE TYPE "public"."operating_system_family" AS ENUM('ubuntu', 'debian', 'fedora', 'centos', 'windows', 'windows server');--> statement-breakpoint
ALTER TABLE "operating_system_release" ALTER COLUMN "family" SET DATA TYPE "public"."operating_system_family" USING "family"::"public"."operating_system_family";