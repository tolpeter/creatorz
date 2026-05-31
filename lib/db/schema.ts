import {
  pgTable, uuid, text, varchar, integer, boolean, timestamp,
  numeric, jsonb, pgEnum, index, uniqueIndex, primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============= ENUMS =============
export const userRoleEnum = pgEnum("user_role", ["creator", "brand", "admin"]);
export const adStatusEnum = pgEnum("ad_status", ["pending", "active", "closed", "rejected"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "accepted", "rejected", "withdrawn"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "canceled", "unpaid", "incomplete"]);
export const featureTypeEnum = pgEnum("feature_type", ["7day", "30day"]);
export const contentTypeEnum = pgEnum("content_type", ["video", "photo", "both"]);
export const portfolioTypeEnum = pgEnum("portfolio_type", ["video", "photo"]);

// ============= USERS =============
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: uuid("auth_id").notNull().unique(),  // Supabase Auth user ID
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull(),
  approved: boolean("approved").notNull().default(false),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
  authIdIdx: uniqueIndex("users_auth_id_idx").on(table.authId),
}));

// ============= CREATOR PROFILES =============
export const creatorProfiles = pgTable("creator_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  bio: text("bio"),  // max 500 chars enforced in zod
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 50 }),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  languages: jsonb("languages").$type<string[]>().notNull().default(["hu"]),
  equipment: jsonb("equipment").$type<{
    phone?: string;
    camera?: string;
    microphone?: string;
    editing?: string;
  }>(),

  // Social media
  instagramUrl: text("instagram_url"),
  instagramFollowers: integer("instagram_followers"),
  instagramVerified: boolean("instagram_verified").notNull().default(false),
  instagramLastChecked: timestamp("instagram_last_checked"),
  tiktokUrl: text("tiktok_url"),
  tiktokFollowers: integer("tiktok_followers"),
  tiktokVerified: boolean("tiktok_verified").notNull().default(false),
  tiktokLastChecked: timestamp("tiktok_last_checked"),
  facebookUrl: text("facebook_url"),
  facebookFollowers: integer("facebook_followers"),
  facebookVerified: boolean("facebook_verified").notNull().default(false),
  facebookLastChecked: timestamp("facebook_last_checked"),
  youtubeUrl: text("youtube_url"),
  youtubeSubscribers: integer("youtube_subscribers"),
  youtubeVerified: boolean("youtube_verified").notNull().default(false),
  youtubeLastChecked: timestamp("youtube_last_checked"),

  // Rate card (JSON array)
  rateCard: jsonb("rate_card").$type<Array<{
    service: string;
    priceHuf: number;
    description?: string;
  }>>().notNull().default([]),

  // Featured status
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredUntil: timestamp("featured_until"),
  isAdminFeatured: boolean("is_admin_featured").notNull().default(false),

  // Stats (cached for performance)
  reviewCount: integer("review_count").notNull().default(0),
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  usernameIdx: uniqueIndex("creator_profiles_username_idx").on(table.username),
  featuredIdx: index("creator_profiles_featured_idx").on(table.isFeatured),
  categoriesIdx: index("creator_profiles_categories_idx").on(table.categories),
}));

// ============= BRAND PROFILES =============
export const brandProfiles = pgTable("brand_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  contactName: varchar("contact_name", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 30 }),
  // Részletes adatok (kötelező csak hirdetésfeladásnál)
  taxNumber: varchar("tax_number", { length: 30 }),
  address: text("address"),
  industry: varchar("industry", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  companyNameIdx: index("brand_profiles_company_idx").on(table.companyName),
}));

// ============= PORTFOLIO ITEMS =============
export const portfolioItems = pgTable("portfolio_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  type: portfolioTypeEnum("type").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  creatorIdx: index("portfolio_creator_idx").on(table.creatorId),
}));

// ============= ADS (BRAND HIRDETÉSEK) =============
export const ads = pgTable("ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brandProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 80 }).notNull(),
  description: text("description").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  contentType: contentTypeEnum("content_type").notNull(),
  itemCount: integer("item_count").notNull().default(1),
  budgetMinHuf: integer("budget_min_huf").notNull(),
  budgetMaxHuf: integer("budget_max_huf").notNull(),
  deadline: timestamp("deadline").notNull(),
  location: varchar("location", { length: 200 }),
  usageRights: varchar("usage_rights", { length: 50 }).notNull(),
  referenceLinks: jsonb("reference_links").$type<string[]>().notNull().default([]),
  status: adStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  isFeatured: boolean("is_featured").notNull().default(false),
  applicationCount: integer("application_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  closedAt: timestamp("closed_at"),
}, (table) => ({
  brandIdx: index("ads_brand_idx").on(table.brandId),
  statusIdx: index("ads_status_idx").on(table.status),
  categoriesIdx: index("ads_categories_idx").on(table.categories),
  deadlineIdx: index("ads_deadline_idx").on(table.deadline),
}));

// ============= AD APPLICATIONS (CREATOR PÁLYÁZATOK) =============
export const adApplications = pgTable("ad_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  adId: uuid("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  proposedPriceHuf: integer("proposed_price_huf").notNull(),
  status: applicationStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  adIdx: index("applications_ad_idx").on(table.adId),
  creatorIdx: index("applications_creator_idx").on(table.creatorId),
  statusIdx: index("applications_status_idx").on(table.status),
  uniqueIdx: uniqueIndex("applications_unique_idx").on(table.adId, table.creatorId),
}));

// ============= COLLABORATIONS (ELFOGADOTT PÁLYÁZATOKBÓL) =============
export const collaborations = pgTable("collaborations", {
  id: uuid("id").primaryKey().defaultRandom(),
  adId: uuid("ad_id").notNull().references(() => ads.id, { onDelete: "set null" }),
  applicationId: uuid("application_id").references(() => adApplications.id, { onDelete: "set null" }),
  brandId: uuid("brand_id").notNull().references(() => brandProfiles.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
  reviewEmailSentAt: timestamp("review_email_sent_at"),
  reviewToken: text("review_token").unique(),  // for token-based review submission
  status: varchar("status", { length: 30 }).notNull().default("active"),
  // status: active / review_pending / reviewed / closed
}, (table) => ({
  brandIdx: index("collab_brand_idx").on(table.brandId),
  creatorIdx: index("collab_creator_idx").on(table.creatorId),
  tokenIdx: uniqueIndex("collab_token_idx").on(table.reviewToken),
}));

// ============= REVIEWS =============
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaborationId: uuid("collaboration_id").notNull().references(() => collaborations.id, { onDelete: "cascade" }).unique(),
  brandId: uuid("brand_id").notNull().references(() => brandProfiles.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  overallRating: integer("overall_rating").notNull(),  // 1-5
  communicationRating: integer("communication_rating").notNull(),
  qualityRating: integer("quality_rating").notNull(),
  deadlineRating: integer("deadline_rating").notNull(),
  text: text("text").notNull(),
  reported: boolean("reported").notNull().default(false),
  hidden: boolean("hidden").notNull().default(false),
  editedUntil: timestamp("edited_until"),
  locked: boolean("locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  creatorIdx: index("reviews_creator_idx").on(table.creatorId),
  brandIdx: index("reviews_brand_idx").on(table.brandId),
  hiddenIdx: index("reviews_hidden_idx").on(table.hidden),
}));

// ============= REVIEW RESPONSES (CREATOR VÁLASZ) =============
export const reviewResponses = pgTable("review_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }).unique(),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  editedUntil: timestamp("edited_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============= MESSAGES (BRAND → CREATOR) =============
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromUserId: uuid("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: uuid("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 200 }),
  body: text("body").notNull(),
  budgetHint: integer("budget_hint"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  toIdx: index("messages_to_idx").on(table.toUserId),
  fromIdx: index("messages_from_idx").on(table.fromUserId),
}));

// ============= SUBSCRIPTIONS =============
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  stripeCustomerIdx: uniqueIndex("subs_stripe_customer_idx").on(table.stripeCustomerId),
}));

// ============= FEATURE PURCHASES (kiemelés vásárlás) =============
export const featurePurchases = pgTable("feature_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  type: featureTypeEnum("type").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull().unique(),
  amountHuf: integer("amount_huf").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  creatorIdx: index("features_creator_idx").on(table.creatorId),
  activeIdx: index("features_active_idx").on(table.endsAt),
}));

// ============= SETTINGS (ADMIN GLOBAL TOGGLES) =============
export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============= NOTIFICATIONS =============
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  readIdx: index("notifications_read_idx").on(table.read),
}));

// ============= RELATIONS =============
export const usersRelations = relations(users, ({ one, many }) => ({
  creatorProfile: one(creatorProfiles),
  brandProfile: one(brandProfiles),
  subscription: one(subscriptions),
  sentMessages: many(messages, { relationName: "from" }),
  receivedMessages: many(messages, { relationName: "to" }),
  notifications: many(notifications),
}));

export const creatorProfilesRelations = relations(creatorProfiles, ({ one, many }) => ({
  user: one(users, { fields: [creatorProfiles.userId], references: [users.id] }),
  portfolio: many(portfolioItems),
  applications: many(adApplications),
  collaborations: many(collaborations),
  reviews: many(reviews),
  featurePurchases: many(featurePurchases),
}));

export const brandProfilesRelations = relations(brandProfiles, ({ one, many }) => ({
  user: one(users, { fields: [brandProfiles.userId], references: [users.id] }),
  ads: many(ads),
  collaborations: many(collaborations),
  reviewsGiven: many(reviews),
}));

export const adsRelations = relations(ads, ({ one, many }) => ({
  brand: one(brandProfiles, { fields: [ads.brandId], references: [brandProfiles.id] }),
  applications: many(adApplications),
}));

export const adApplicationsRelations = relations(adApplications, ({ one }) => ({
  ad: one(ads, { fields: [adApplications.adId], references: [ads.id] }),
  creator: one(creatorProfiles, { fields: [adApplications.creatorId], references: [creatorProfiles.id] }),
}));

export const collaborationsRelations = relations(collaborations, ({ one }) => ({
  ad: one(ads, { fields: [collaborations.adId], references: [ads.id] }),
  application: one(adApplications, { fields: [collaborations.applicationId], references: [adApplications.id] }),
  brand: one(brandProfiles, { fields: [collaborations.brandId], references: [brandProfiles.id] }),
  creator: one(creatorProfiles, { fields: [collaborations.creatorId], references: [creatorProfiles.id] }),
  review: one(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  collaboration: one(collaborations, { fields: [reviews.collaborationId], references: [collaborations.id] }),
  brand: one(brandProfiles, { fields: [reviews.brandId], references: [brandProfiles.id] }),
  creator: one(creatorProfiles, { fields: [reviews.creatorId], references: [creatorProfiles.id] }),
  response: one(reviewResponses),
}));
