import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  creatorProfiles,
  brandProfiles,
  brandReviews,
  portfolioItems,
  ads,
  adApplications,
  collaborations,
  reviews,
  reviewResponses,
  messages,
  subscriptions,
  featurePurchases,
  settings,
  notifications,
  contactMessages,
  savedCreators,
  reports,
  blogPosts,
  profileViews,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Teljes adatbázis-mentés admin-only JSON formátumban. Minden táblát egy
 * objektumba olvas, és letöltésre küld vissza. Vészhelyzet esetén a JSON
 * mezőkből visszaállíthatók a táblák egy importer-script-tel (lásd
 * `scripts/restore-backup.mjs`, ha valaha szükség lenne rá).
 *
 * Ez NEM helyettesíti a Supabase platform-szintű napi snapshot-jait, de
 * a tulajdonosnak közvetlen, gyors hozzáférést ad a teljes tartalomhoz.
 */
export async function GET() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  const [
    usersData,
    creatorProfilesData,
    brandProfilesData,
    brandReviewsData,
    portfolioItemsData,
    adsData,
    adApplicationsData,
    collaborationsData,
    reviewsData,
    reviewResponsesData,
    messagesData,
    subscriptionsData,
    featurePurchasesData,
    settingsData,
    notificationsData,
    contactMessagesData,
    savedCreatorsData,
    reportsData,
    blogPostsData,
    profileViewsData,
  ] = await Promise.all([
    db.select().from(users),
    db.select().from(creatorProfiles),
    db.select().from(brandProfiles),
    db.select().from(brandReviews),
    db.select().from(portfolioItems),
    db.select().from(ads),
    db.select().from(adApplications),
    db.select().from(collaborations),
    db.select().from(reviews),
    db.select().from(reviewResponses),
    db.select().from(messages),
    db.select().from(subscriptions),
    db.select().from(featurePurchases),
    db.select().from(settings),
    db.select().from(notifications),
    db.select().from(contactMessages),
    db.select().from(savedCreators),
    db.select().from(reports),
    db.select().from(blogPosts),
    db.select().from(profileViews),
  ]);

  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    counts: {
      users: usersData.length,
      creatorProfiles: creatorProfilesData.length,
      brandProfiles: brandProfilesData.length,
      brandReviews: brandReviewsData.length,
      portfolioItems: portfolioItemsData.length,
      ads: adsData.length,
      adApplications: adApplicationsData.length,
      collaborations: collaborationsData.length,
      reviews: reviewsData.length,
      reviewResponses: reviewResponsesData.length,
      messages: messagesData.length,
      subscriptions: subscriptionsData.length,
      featurePurchases: featurePurchasesData.length,
      settings: settingsData.length,
      notifications: notificationsData.length,
      contactMessages: contactMessagesData.length,
      savedCreators: savedCreatorsData.length,
      reports: reportsData.length,
      blogPosts: blogPostsData.length,
      profileViews: profileViewsData.length,
    },
    tables: {
      users: usersData,
      creator_profiles: creatorProfilesData,
      brand_profiles: brandProfilesData,
      brand_reviews: brandReviewsData,
      portfolio_items: portfolioItemsData,
      ads: adsData,
      ad_applications: adApplicationsData,
      collaborations: collaborationsData,
      reviews: reviewsData,
      review_responses: reviewResponsesData,
      messages: messagesData,
      subscriptions: subscriptionsData,
      feature_purchases: featurePurchasesData,
      settings: settingsData,
      notifications: notificationsData,
      contact_messages: contactMessagesData,
      saved_creators: savedCreatorsData,
      reports: reportsData,
      blog_posts: blogPostsData,
      profile_views: profileViewsData,
    },
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="creatorz-backup-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
