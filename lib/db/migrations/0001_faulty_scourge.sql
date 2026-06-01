CREATE TABLE "saved_creators" (
	"brand_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "saved_creators_brand_id_creator_id_pk" PRIMARY KEY("brand_id","creator_id")
);
--> statement-breakpoint
ALTER TABLE "saved_creators" ADD CONSTRAINT "saved_creators_brand_id_brand_profiles_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_creators" ADD CONSTRAINT "saved_creators_creator_id_creator_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE cascade ON UPDATE no action;