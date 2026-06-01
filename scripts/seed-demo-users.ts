/**
 * Demó fiókok létrehozása teszteléshez (megerősített userek, nincs email).
 *  - creator@videmark.hu / Teszt1234  (kitöltött creator profil + 3 portfólió)
 *  - brand@videmark.hu   / Teszt1234  (brand profil)
 * Idempotens: ha léteznek, újra létrehozza őket.
 */
import { createClient } from "@supabase/supabase-js";
import { db } from "../lib/db/index";
import { users, creatorProfiles, brandProfiles, portfolioItems } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Teszt1234";

async function recreateAuthUser(email: string, role: "creator" | "brand") {
  await db.delete(users).where(eq(users.email, email));
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (existing) await admin.auth.admin.deleteUser(existing.id);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  const ins = await db
    .insert(users)
    .values({ authId: data.user!.id, email, role })
    .returning({ id: users.id });
  return ins[0]!.id;
}

async function main() {
  // ---- CREATOR ----
  const creatorEmail = "creator@videmark.hu";
  const creatorUserId = await recreateAuthUser(creatorEmail, "creator");
  const cp = await db
    .insert(creatorProfiles)
    .values({
      userId: creatorUserId,
      username: "anna-kreator",
      displayName: "Anna Kreátor",
      bio: "UGC tartalomgyártó Budapestről — gasztró, lifestyle és beauty videók.",
      city: "Budapest",
      county: "Budapest",
      age: 27,
      gender: "no",
      categories: ["gasztro", "lifestyle", "beauty"],
      languages: ["hu", "en"],
      avatarUrl: "https://picsum.photos/seed/anna/200/200",
      bannerUrl: "https://picsum.photos/seed/annabanner/1200/300",
      equipment: { phone: "iPhone 15 Pro", camera: "Sony ZV-1", microphone: "Rode VideoMic", editing: "CapCut" },
      instagramUrl: "https://instagram.com/anna.kreator",
      instagramFollowers: 18400,
      tiktokUrl: "https://tiktok.com/@anna.kreator",
      tiktokFollowers: 42100,
      rateCard: [
        { service: "30 mp-es UGC videó", priceHuf: 25000, description: "Forgatókönyv + 1 körös módosítás" },
        { service: "Termékfotó csomag (5 db)", priceHuf: 18000 },
      ],
    })
    .returning({ id: creatorProfiles.id });
  const creatorId = cp[0]!.id;

  await db.delete(portfolioItems).where(eq(portfolioItems.creatorId, creatorId));
  const demoPortfolio = [
    { title: "Reggeli recept reel", cats: ["gasztro"] },
    { title: "Bőrápolási rutin", cats: ["beauty"] },
    { title: "Egy napom vlog", cats: ["lifestyle"] },
  ];
  for (let i = 0; i < demoPortfolio.length; i++) {
    await db.insert(portfolioItems).values({
      creatorId,
      type: "photo",
      url: `https://picsum.photos/seed/p${i}/600/400`,
      title: demoPortfolio[i]!.title,
      categories: demoPortfolio[i]!.cats,
      sortOrder: i,
    });
  }

  // ---- BRAND ----
  const brandEmail = "brand@videmark.hu";
  const brandUserId = await recreateAuthUser(brandEmail, "brand");
  await db.insert(brandProfiles).values({
    userId: brandUserId,
    companyName: "Próba Márka Kft.",
    websiteUrl: "https://probamarka.hu",
    contactName: "Nagy Péter",
    industry: "Szépségápolás",
  });

  console.log("✅ Demó fiókok készen:");
  console.log("   CREATOR  →  creator@videmark.hu  /  Teszt1234");
  console.log("   BRAND    →  brand@videmark.hu    /  Teszt1234");
}

main()
  .catch((e) => {
    console.error("❌ HIBA:", (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
