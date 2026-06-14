CREATE TYPE "public"."profile_kind" AS ENUM('ugc', 'professional');--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "profile_kind" "profile_kind" DEFAULT 'ugc' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "professional_roles" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "specialties" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "embed_type" varchar(20);