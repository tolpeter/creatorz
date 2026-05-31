CREATE TYPE "public"."ad_status" AS ENUM('pending', 'active', 'closed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('video', 'photo', 'both');--> statement-breakpoint
CREATE TYPE "public"."feature_type" AS ENUM('7day', '30day');--> statement-breakpoint
CREATE TYPE "public"."portfolio_type" AS ENUM('video', 'photo');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'unpaid', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('creator', 'brand', 'admin');--> statement-breakpoint
CREATE TABLE "ad_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"message" text NOT NULL,
	"proposed_price_huf" integer NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_type" "content_type" NOT NULL,
	"item_count" integer DEFAULT 1 NOT NULL,
	"budget_min_huf" integer NOT NULL,
	"budget_max_huf" integer NOT NULL,
	"deadline" timestamp NOT NULL,
	"location" varchar(200),
	"usage_rights" varchar(50) NOT NULL,
	"reference_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "ad_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"application_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "brand_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"website_url" text,
	"logo_url" text,
	"contact_name" varchar(100),
	"contact_phone" varchar(30),
	"tax_number" varchar(30),
	"address" text,
	"industry" varchar(100),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "collaborations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" uuid NOT NULL,
	"application_id" uuid,
	"brand_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"review_email_sent_at" timestamp,
	"review_token" text,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	CONSTRAINT "collaborations_review_token_unique" UNIQUE("review_token")
);
--> statement-breakpoint
CREATE TABLE "creator_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"banner_url" text,
	"bio" text,
	"city" varchar(100),
	"county" varchar(50),
	"age" integer,
	"gender" varchar(20),
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '["hu"]'::jsonb NOT NULL,
	"equipment" jsonb,
	"instagram_url" text,
	"instagram_followers" integer,
	"instagram_verified" boolean DEFAULT false NOT NULL,
	"instagram_last_checked" timestamp,
	"tiktok_url" text,
	"tiktok_followers" integer,
	"tiktok_verified" boolean DEFAULT false NOT NULL,
	"tiktok_last_checked" timestamp,
	"facebook_url" text,
	"facebook_followers" integer,
	"facebook_verified" boolean DEFAULT false NOT NULL,
	"facebook_last_checked" timestamp,
	"youtube_url" text,
	"youtube_subscribers" integer,
	"youtube_verified" boolean DEFAULT false NOT NULL,
	"youtube_last_checked" timestamp,
	"rate_card" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp,
	"is_admin_featured" boolean DEFAULT false NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "creator_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "feature_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"type" "feature_type" NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"amount_huf" integer NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_purchases_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"subject" varchar(200),
	"body" text NOT NULL,
	"budget_hint" integer,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"type" "portfolio_type" NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"title" varchar(200),
	"description" text,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"text" text NOT NULL,
	"edited_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_responses_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collaboration_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"overall_rating" integer NOT NULL,
	"communication_rating" integer NOT NULL,
	"quality_rating" integer NOT NULL,
	"deadline_rating" integer NOT NULL,
	"text" text NOT NULL,
	"reported" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"edited_until" timestamp,
	"locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_collaboration_id_unique" UNIQUE("collaboration_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text,
	"status" "subscription_status" NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ad_applications" ADD CONSTRAINT "ad_applications_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_applications" ADD CONSTRAINT "ad_applications_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_brand_id_brand_profiles_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_application_id_ad_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."ad_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_brand_id_brand_profiles_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_purchases" ADD CONSTRAINT "feature_purchases_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_collaboration_id_collaborations_id_fk" FOREIGN KEY ("collaboration_id") REFERENCES "public"."collaborations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_brand_id_brand_profiles_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_ad_idx" ON "ad_applications" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "applications_creator_idx" ON "ad_applications" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "ad_applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_unique_idx" ON "ad_applications" USING btree ("ad_id","creator_id");--> statement-breakpoint
CREATE INDEX "ads_brand_idx" ON "ads" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "ads_status_idx" ON "ads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ads_categories_idx" ON "ads" USING btree ("categories");--> statement-breakpoint
CREATE INDEX "ads_deadline_idx" ON "ads" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "brand_profiles_company_idx" ON "brand_profiles" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "collab_brand_idx" ON "collaborations" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "collab_creator_idx" ON "collaborations" USING btree ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_token_idx" ON "collaborations" USING btree ("review_token");--> statement-breakpoint
CREATE UNIQUE INDEX "creator_profiles_username_idx" ON "creator_profiles" USING btree ("username");--> statement-breakpoint
CREATE INDEX "creator_profiles_featured_idx" ON "creator_profiles" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "creator_profiles_categories_idx" ON "creator_profiles" USING btree ("categories");--> statement-breakpoint
CREATE INDEX "features_creator_idx" ON "feature_purchases" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "features_active_idx" ON "feature_purchases" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "messages_to_idx" ON "messages" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "messages_from_idx" ON "messages" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "portfolio_creator_idx" ON "portfolio_items" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "reviews_creator_idx" ON "reviews" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "reviews_brand_idx" ON "reviews" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "reviews_hidden_idx" ON "reviews" USING btree ("hidden");--> statement-breakpoint
CREATE UNIQUE INDEX "subs_stripe_customer_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_id_idx" ON "users" USING btree ("auth_id");