import {
  pgTable, uuid, text, varchar, integer, boolean, timestamp,
  numeric, jsonb, pgEnum, index, uniqueIndex, primaryKey, date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { BlogBlock, BlogFaq } from "@/lib/blog/types";

// ============= ENUMS =============
export const userRoleEnum = pgEnum("user_role", ["creator", "brand", "admin"]);
export const adStatusEnum = pgEnum("ad_status", ["pending", "active", "closed", "rejected", "suspended", "expired"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "accepted", "rejected", "withdrawn"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "canceled", "unpaid", "incomplete"]);
export const featureTypeEnum = pgEnum("feature_type", ["7day", "30day"]);
export const contentTypeEnum = pgEnum("content_type", ["video", "photo", "both"]);
export const portfolioTypeEnum = pgEnum("portfolio_type", ["video", "photo"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "resolved", "dismissed"]);

// Általános tartalom-bejelentés (profil / hirdetés)
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterUserId: uuid("reporter_user_id").references(() => users.id, { onDelete: "set null" }),
  reportedUserId: uuid("reported_user_id").references(() => users.id, { onDelete: "set null" }),
  targetType: varchar("target_type", { length: 20 }).notNull(), // creator | ad
  targetId: uuid("target_id").notNull(),
  targetLabel: text("target_label"),
  targetUrl: text("target_url"),
  reason: varchar("reason", { length: 40 }).notNull(),
  note: text("note"),
  status: reportStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => ({
  statusIdx: index("reports_status_idx").on(table.status),
}));

// Együttműködés típusa: projekt (egyszeri), hosszútávú, barter
export const collaborationTypeEnum = pgEnum("collaboration_type", ["project", "longterm", "barter"]);
// Profil típusa: UGC tartalomgyártó vagy kreatív szakember (videóvágó/fotós/operatőr)
export const profileKindEnum = pgEnum("profile_kind", ["ugc", "professional"]);

export const blogStatusEnum = pgEnum("blog_status", ["draft", "published"]);

// ============= BLOG POSTS (AI által generált SEO tartalom) =============
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  title: text("title").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  excerpt: text("excerpt"),
  coverUrl: text("cover_url"),
  coverAlt: text("cover_alt"),
  content: jsonb("content").$type<BlogBlock[]>().notNull().default([]),
  faq: jsonb("faq").$type<BlogFaq[]>().default([]),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  topic: text("topic"),
  readMinutes: integer("read_minutes").notNull().default(4),
  views: integer("views").notNull().default(0),
  status: blogStatusEnum("status").notNull().default("published"),
  aiGenerated: boolean("ai_generated").notNull().default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex("blog_posts_slug_idx").on(t.slug),
  statusIdx: index("blog_posts_status_idx").on(t.status, t.publishedAt),
}));

// ============= PROFILE VIEWS (márka megnézte a creatort) =============
export const profileViews = pgTable("profile_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  // A megtekintő felhasználó (lehet márka VAGY másik tartalomgyártó). Ez a fő
  // azonosító a napi dedup-hoz. A brandId visszamenőleg megmaradt (régi sorok).
  viewerUserId: uuid("viewer_user_id").references(() => users.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").references(() => brandProfiles.id, { onDelete: "cascade" }),
  viewedDate: date("viewed_date").notNull(),  // napi dedup (YYYY-MM-DD)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  // Megj.: a korábbi napi-dedup unique index törölve (migrate-ad-slugs.mjs) —
  // mostantól MINDEN megtekintés külön sor (5 megtekintés = 5).
  creatorIdx: index("profile_views_creator_idx").on(t.creatorId),
}));

// ============= AD VIEWS (ki nézte meg a hirdetést) =============
// A hirdetés-megtekintők azonosításához (csak a "látja a megtekintőket"
// funkcióhoz). Minden megtekintés egy sor; anonim látogatónál viewerUserId null.
export const adViews = pgTable("ad_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  adId: uuid("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  viewerUserId: uuid("viewer_user_id").references(() => users.id, { onDelete: "set null" }),
  viewedDate: date("viewed_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  adIdx: index("ad_views_ad_idx").on(t.adId),
}));

// ============= USERS =============
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: uuid("auth_id").notNull().unique(),  // Supabase Auth user ID
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull(),
  approved: boolean("approved").notNull().default(false),
  suspended: boolean("suspended").notNull().default(false),
  // Admin által kapcsolható: ha igaz, a felhasználó nem csak a megtekintések
  // SZÁMÁT látja, hanem azt is, KIK nézték meg a profilját / hirdetését.
  canSeeViewers: boolean("can_see_viewers").notNull().default(false),
  // Email-verifikáció (saját rendszer — a Supabase auth-tól független):
  // ezen keresztül kényszerítjük ki, hogy a regisztráció + onboarding végén
  // a user megerősítse az emailcímét, mielőtt a dashboardot használhatná.
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at"),
  // Jelszó-visszaállítás (saját Resend-es rendszer — branded email).
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiresAt: timestamp("password_reset_expires_at"),
  // Ajánlási (referral) kód — egyedi, megosztható meghívó-linkhez.
  referralCode: varchar("referral_code", { length: 16 }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
  authIdIdx: uniqueIndex("users_auth_id_idx").on(table.authId),
  emailVerificationTokenIdx: uniqueIndex("users_email_verification_token_idx").on(table.emailVerificationToken),
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
  // Pontos születési dátum (regisztrációkor kérjük). Az életkort (age) ebből
  // számoljuk és tároljuk, a profilon CSAK az életkor jelenik meg.
  birthDate: date("birth_date"),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  languages: jsonb("languages").$type<string[]>().notNull().default(["hu"]),

  // Profil típusa: UGC tartalomgyártó vagy kreatív szakember
  profileKind: profileKindEnum("profile_kind").notNull().default("ugc"),
  // Csak professional profilnál: szerepkörök — "editor" | "photographer" | "videographer"
  professionalRoles: jsonb("professional_roles").$type<string[]>().notNull().default([]),
  // Csak professional profilnál: szakterület/stílus chip-ek (pl. "Esküvő", "Reklámfilm")
  specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
  // Opcionális külső link (weboldal / Behance / portfólió-oldal)
  websiteUrl: text("website_url"),

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
  // Bővített TikTok-statisztika (publikus profil HTML-ből, scrape+AI).
  tiktokLikes: integer("tiktok_likes"), // összes szív/like a profilon
  tiktokAvgViews: integer("tiktok_avg_views"), // átlagos megtekintés / videó
  tiktokVideoCount: integer("tiktok_video_count"),
  tiktokVerified: boolean("tiktok_verified").notNull().default(false),
  tiktokLastChecked: timestamp("tiktok_last_checked"),
  // Hivatalos TikTok API (Login Kit) összekötés — ha igaz, a statok a TikTok
  // hivatalos Display API-jából jönnek (nem scrape/AI). A tokenek külön
  // táblában (tiktok_connections), nem itt.
  tiktokOfficial: boolean("tiktok_official").notNull().default(false),
  facebookUrl: text("facebook_url"),
  facebookFollowers: integer("facebook_followers"),
  facebookVerified: boolean("facebook_verified").notNull().default(false),
  facebookLastChecked: timestamp("facebook_last_checked"),
  youtubeUrl: text("youtube_url"),
  youtubeSubscribers: integer("youtube_subscribers"),
  youtubeVerified: boolean("youtube_verified").notNull().default(false),
  youtubeLastChecked: timestamp("youtube_last_checked"),

  // Kiemelt bemutatkozó videó (1 db, saját feltöltés, max 50 MB)
  introVideoUrl: text("intro_video_url"),

  // Self-hitelesítés: a creator maga hitelesíti a profilját (badge a profilon)
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),

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

  // AI matching: a profil szöveges lenyomatának embedding-vektora (OpenAI
  // text-embedding-3-small, 1536 dim). A hirdetés↔creator szemantikus
  // párosításhoz. Mentéskor frissül, hiányzót lazy módon pótolunk.
  embedding: jsonb("embedding").$type<number[]>(),
  embeddingUpdatedAt: timestamp("embedding_updated_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  usernameIdx: uniqueIndex("creator_profiles_username_idx").on(table.username),
  featuredIdx: index("creator_profiles_featured_idx").on(table.isFeatured),
  categoriesIdx: index("creator_profiles_categories_idx").on(table.categories),
}));

// ============= TIKTOK CONNECTIONS (hivatalos OAuth tokenek) =============
// Külön tábla, hogy az érzékeny tokenek SOHA ne kerüljenek bele a publikus
// creator_profiles lekérdezésekbe. Csak szerveroldali, service-role hozzáférés.
export const tiktokConnections = pgTable("tiktok_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  openId: varchar("open_id", { length: 128 }).notNull(),
  unionId: varchar("union_id", { length: 128 }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  scope: text("scope"),
  expiresAt: timestamp("expires_at"),
  refreshExpiresAt: timestamp("refresh_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============= PAGE EVENTS (first-party látogatottság-mérés) =============
// Oldalanként eltöltött idő (ms), munkamenet-azonosítóval és (ha be van lépve)
// userId-vel. Ebből számoljuk az admin analitikán a regisztrált vs nem
// regisztrált átlagos időt és az oldalankénti bontást.
export const pageEvents = pgTable("page_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  path: varchar("path", { length: 300 }).notNull(),
  durationMs: integer("duration_ms").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  createdIdx: index("page_events_created_idx").on(t.createdAt),
  sessionIdx: index("page_events_session_idx").on(t.sessionId),
}));

// ============= REFERRALS (ajánlási program) =============
// Ki kit hívott meg. Egy meghívott user csak egyszer számít (unique).
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerUserId: uuid("referrer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: uuid("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  referrerIdx: index("referrals_referrer_idx").on(t.referrerUserId),
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
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  companyNameIdx: index("brand_profiles_company_idx").on(table.companyName),
}));

// ============= BRAND REVIEWS (tartalomgyártó → márka) =============
export const brandReviews = pgTable("brand_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaborationId: uuid("collaboration_id").notNull().references(() => collaborations.id, { onDelete: "cascade" }).unique(),
  brandId: uuid("brand_id").notNull().references(() => brandProfiles.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  overallRating: integer("overall_rating").notNull(),
  communicationRating: integer("communication_rating").notNull(),
  fairnessRating: integer("fairness_rating").notNull(),     // korrektség / fizetés
  clarityRating: integer("clarity_rating").notNull(),       // a brief egyértelműsége
  text: text("text").notNull(),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  brandIdx: index("brand_reviews_brand_idx").on(table.brandId),
}));

// ============= PORTFOLIO ITEMS =============
export const portfolioItems = pgTable("portfolio_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  type: portfolioTypeEnum("type").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  // Külső link portfólió (kreatív szakemberek): ha kitöltött, nem feltöltött fájl.
  externalUrl: text("external_url"),
  // Beágyazás típusa: "drive" | "youtube" | "vimeo" | "link" | null (feltöltött fájl)
  embedType: varchar("embed_type", { length: 20 }),
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
  // SEO-barát URL-slug (a címből generálva, egyedi). Régi sorok backfillel kapnak.
  slug: varchar("slug", { length: 120 }),
  description: text("description").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  // Kit keres a márka: "ugc" | "editor" | "photographer" | "videographer" (több is)
  targetKinds: jsonb("target_kinds").$type<string[]>().notNull().default(["ugc"]),
  contentType: contentTypeEnum("content_type").notNull(),
  itemCount: integer("item_count").notNull().default(1),
  // Borítókép (opcionális, a márka tölti fel)
  coverUrl: text("cover_url"),
  // Költségvetés opcionális — alapból NEM publikus (megbeszélés kérdése),
  // csak ha a márka kifejezetten közzéteszi (budgetPublic).
  budgetMinHuf: integer("budget_min_huf"),
  budgetMaxHuf: integer("budget_max_huf"),
  budgetPublic: boolean("budget_public").notNull().default(false),
  // Együttműködés típusa (creator-szűrhető)
  collaborationType: collaborationTypeEnum("collaboration_type").notNull().default("project"),
  deadline: timestamp("deadline").notNull(),
  location: varchar("location", { length: 200 }),
  usageRights: varchar("usage_rights", { length: 50 }).notNull(),
  referenceLinks: jsonb("reference_links").$type<string[]>().notNull().default([]),
  status: adStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  isFeatured: boolean("is_featured").notNull().default(false),
  applicationCount: integer("application_count").notNull().default(0),
  // Anonim hirdetés: ha be van pipálva, a publikus felületen NEM látszik
  // a márka neve, logója, weboldala. Csak az adminok és a creator (aki pályázik)
  // látja a részleteket. A regisztrációhoz szükséges márka-adatok megmaradnak.
  anonymous: boolean("anonymous").notNull().default(false),
  // Hány alkotót keres a kampány: "one" | "multiple". NULL = "nem adom meg"
  // (ilyenkor nem jelenik meg a kampányban).
  seekingCount: varchar("seeking_count", { length: 16 }),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  closedAt: timestamp("closed_at"),
  // Soft-delete / archívum: ha kitöltött, a kampány törölve van (NEM jelenik meg
  // sehol), de az admin Archívumban bármikor visszanézhető/visszaállítható.
  deletedAt: timestamp("deleted_at"),
  deletedByRole: varchar("deleted_by_role", { length: 10 }), // 'brand' | 'admin'
}, (table) => ({
  brandIdx: index("ads_brand_idx").on(table.brandId),
  statusIdx: index("ads_status_idx").on(table.status),
  categoriesIdx: index("ads_categories_idx").on(table.categories),
  deadlineIdx: index("ads_deadline_idx").on(table.deadline),
  collabTypeIdx: index("ads_collab_type_idx").on(table.collaborationType),
  slugIdx: uniqueIndex("ads_slug_idx").on(table.slug),
}));

// ============= AD APPLICATIONS (CREATOR PÁLYÁZATOK) =============
export const adApplications = pgTable("ad_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  adId: uuid("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  // Ár-ajánlat opcionális — az ár mindig megegyezés kérdése a felek között
  proposedPriceHuf: integer("proposed_price_huf"),
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

// ============= AD INVITATIONS (BRAND → CREATOR meghívás hirdetésre) =====
// A márka egy konkrét, aktív hirdetésére hívhat meg egy tartalomgyártót.
// A creator értesítést + emailt kap, és a hirdetés oldalán kiemelt banner
// jelzi a meghívást. Egy (hirdetés, creator) párra csak egy meghívás lehet.
export const adInvitations = pgTable("ad_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  adId: uuid("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brandProfiles.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  message: text("message"),
  // pending = elküldve; applied = a creator pályázott rá; dismissed = elutasította
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  uniqueIdx: uniqueIndex("ad_invitations_unique_idx").on(table.adId, table.creatorId),
  creatorIdx: index("ad_invitations_creator_idx").on(table.creatorId),
  brandIdx: index("ad_invitations_brand_idx").on(table.brandId),
}));

// ============= COLLABORATIONS (ELFOGADOTT PÁLYÁZATOKBÓL) =============
export const collaborations = pgTable("collaborations", {
  id: uuid("id").primaryKey().defaultRandom(),
  adId: uuid("ad_id").notNull().references(() => ads.id, { onDelete: "set null" }),
  applicationId: uuid("application_id").references(() => adApplications.id, { onDelete: "set null" }),
  brandId: uuid("brand_id").notNull().references(() => brandProfiles.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),   // creator leadta a munkát
  completedAt: timestamp("completed_at"),   // brand lezárta az együttműködést
  reviewEmailSentAt: timestamp("review_email_sent_at"),
  reviewToken: text("review_token").unique(),  // for token-based review submission
  status: varchar("status", { length: 30 }).notNull().default("active"),
  // status: active / review_pending / reviewed / closed
}, (table) => ({
  brandIdx: index("collab_brand_idx").on(table.brandId),
  creatorIdx: index("collab_creator_idx").on(table.creatorId),
  tokenIdx: uniqueIndex("collab_token_idx").on(table.reviewToken),
}));

// ============= COLLABORATION EVENTS (idővonal-események a chatben) =============
// Minden leadás / változtatás-kérés / jóváhagyás dátumozott eseményként ide
// kerül, hogy a beszélgetésben időrendben "box"-ként megjelenjen és visszakövethető legyen.
export const collaborationEvents = pgTable("collaboration_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaborationId: uuid("collaboration_id")
    .notNull()
    .references(() => collaborations.id, { onDelete: "cascade" }),
  // 'delivered' | 'changes_requested' | 'approved'
  kind: varchar("kind", { length: 24 }).notNull(),
  note: text("note"), // pl. a változtatás-kérés szövege
  byUserId: uuid("by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  collabIdx: index("collab_events_collab_idx").on(table.collaborationId),
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
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
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

// ============= PUSH TOKENS (mobil app Expo push értesítésekhez) =============
export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: varchar("platform", { length: 20 }), // ios | android
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("push_tokens_user_idx").on(t.userId),
  tokenIdx: uniqueIndex("push_tokens_token_idx").on(t.token),
}));

// ============= CONTACT MESSAGES (kapcsolat űrlap → admin inbox) =============
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }),
  email: varchar("email", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 160 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  // Admin-válasz követése: a /admin/messages felületről küldött válasz szövege
  // és időpontja. Így látszik, melyik üzenetre válaszoltunk már.
  replied: boolean("replied").notNull().default(false),
  replyBody: text("reply_body"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  readIdx: index("contact_messages_read_idx").on(table.read),
  createdIdx: index("contact_messages_created_idx").on(table.createdAt),
}));

// ============= HÍRLEVÉL-FELIRATKOZÓK (lábléc + app-popup egy helyre) =======
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 200 }).notNull(),
  // Honnan iratkozott fel: 'footer' | 'app_popup' | egyéb.
  source: varchar("source", { length: 40 }).notNull().default("footer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex("newsletter_email_idx").on(table.email),
  createdIdx: index("newsletter_created_idx").on(table.createdAt),
}));

// ============= SAVED CREATORS (BRAND ⭐ CREATOR) =============
export const savedCreators = pgTable("saved_creators", {
  brandId: uuid("brand_id").notNull().references(() => brandProfiles.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => creatorProfiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  notes: text("notes"),
}, (table) => ({
  pk: primaryKey({ columns: [table.brandId, table.creatorId] }),
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
