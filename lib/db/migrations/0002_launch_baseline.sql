CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."collaboration_type" AS ENUM('project', 'longterm', 'barter');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(220) NOT NULL,
	"title" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"excerpt" text,
	"cover_url" text,
	"cover_alt" text,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faq" jsonb DEFAULT '[]'::jsonb,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"topic" text,
	"read_minutes" integer DEFAULT 4 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"status" "blog_status" DEFAULT 'published' NOT NULL,
	"ai_generated" boolean DEFAULT true NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "brand_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collaboration_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"overall_rating" integer NOT NULL,
	"communication_rating" integer NOT NULL,
	"fairness_rating" integer NOT NULL,
	"clarity_rating" integer NOT NULL,
	"text" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_reviews_collaboration_id_unique" UNIQUE("collaboration_id")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120),
	"email" varchar(200) NOT NULL,
	"subject" varchar(160) NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"viewed_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" uuid,
	"reported_user_id" uuid,
	"target_type" varchar(20) NOT NULL,
	"target_id" uuid NOT NULL,
	"target_label" text,
	"target_url" text,
	"reason" varchar(40) NOT NULL,
	"note" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ad_applications" ALTER COLUMN "proposed_price_huf" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ALTER COLUMN "budget_min_huf" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ALTER COLUMN "budget_max_huf" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "budget_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "collaboration_type" "collaboration_type" DEFAULT 'project' NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "average_rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "collaborations" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "collaborations" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "intro_video_url" text;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_name" text;--> statement-breakpoint
ALTER TABLE "brand_reviews" ADD CONSTRAINT "brand_reviews_collaboration_id_collaborations_id_fk" FOREIGN KEY ("collaboration_id") REFERENCES "public"."collaborations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_reviews" ADD CONSTRAINT "brand_reviews_brand_id_brand_profiles_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_reviews" ADD CONSTRAINT "brand_reviews_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_brand_id_brand_profiles_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "brand_reviews_brand_idx" ON "brand_reviews" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "contact_messages_read_idx" ON "contact_messages" USING btree ("read");--> statement-breakpoint
CREATE INDEX "contact_messages_created_idx" ON "contact_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_views_unique_day_idx" ON "profile_views" USING btree ("creator_id","brand_id","viewed_date");--> statement-breakpoint
CREATE INDEX "profile_views_creator_idx" ON "profile_views" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ads_collab_type_idx" ON "ads" USING btree ("collaboration_type");