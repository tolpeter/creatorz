import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, creatorProfiles } from "@/lib/db/schema";
import { CreatorSidebar } from "@/components/creator/creator-sidebar";
import { getSetting } from "@/lib/settings";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  if (!current?.dbUser) redirect("/login");
  if (current.dbUser.role !== "creator") {
    redirect(current.dbUser.role === "brand" ? "/brand" : "/admin");
  }

  const unreadRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(eq(messages.toUserId, current.dbUser.id), eq(messages.read, false)),
    );
  const unreadMessages = unreadRows[0]?.n ?? 0;

  // Profil kitöltöttség az oldalsáv-widgethez (ugyanaz a 7 ellenőrzés mint a szerkesztőben)
  const pf = await db
    .select({
      displayName: creatorProfiles.displayName,
      username: creatorProfiles.username,
      bio: creatorProfiles.bio,
      city: creatorProfiles.city,
      county: creatorProfiles.county,
      avatarUrl: creatorProfiles.avatarUrl,
      categories: creatorProfiles.categories,
      languages: creatorProfiles.languages,
      instagramUrl: creatorProfiles.instagramUrl,
      tiktokUrl: creatorProfiles.tiktokUrl,
      facebookUrl: creatorProfiles.facebookUrl,
      youtubeUrl: creatorProfiles.youtubeUrl,
    })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, current.dbUser.id))
    .limit(1);
  const p = pf[0];
  let profileScore = 0;
  if (p) {
    const checks = [
      Boolean(p.displayName && p.username),
      (p.categories?.length ?? 0) > 0,
      (p.languages?.length ?? 0) > 0,
      Boolean(p.avatarUrl),
      Boolean(p.bio),
      Boolean(p.city || p.county),
      Boolean(p.instagramUrl || p.tiktokUrl || p.facebookUrl || p.youtubeUrl),
    ];
    profileScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  // Előfizetés menüpont csak akkor, ha az admin globálisan bekapcsolta.
  const subscriptionEnabled = await getSetting("creator_subscription_enabled");

  return (
    <div className="flex w-full flex-col md:flex-row">
      <aside className="px-4 pt-4 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-64 md:shrink-0 md:px-0 md:pt-0">
        <CreatorSidebar
          unreadMessages={unreadMessages}
          profileScore={profileScore}
          subscriptionEnabled={subscriptionEnabled}
        />
      </aside>
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
