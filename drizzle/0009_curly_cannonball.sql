CREATE TYPE "public"."operating_system_category" AS ENUM('linux', 'windows');--> statement-breakpoint
CREATE TYPE "public"."operating_system_family" AS ENUM('centos', 'debian', 'fedora', 'ubuntu', 'windows');--> statement-breakpoint
ALTER TABLE "operating_system_category" ALTER COLUMN "name" SET DATA TYPE "public"."operating_system_category" USING "name"::"public"."operating_system_category";--> statement-breakpoint
ALTER TABLE "operating_system_release" ALTER COLUMN "family" SET DATA TYPE "public"."operating_system_family" USING "family"::"public"."operating_system_family";