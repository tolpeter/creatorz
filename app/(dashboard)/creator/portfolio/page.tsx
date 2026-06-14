import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { portfolioItems } from "@/lib/db/schema";
import { getCurrentCreator } from "@/lib/auth";
import {
  PortfolioManager,
  type PortfolioItemView,
} from "@/components/creator/portfolio-manager";

export const metadata = { title: "Portfolio" };

export default async function CreatorPortfolioPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const rows = await db
    .select()
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, creator.profile.id))
    .orderBy(asc(portfolioItems.sortOrder));

  const items: PortfolioItemView[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    url: r.url,
    thumbnailUrl: r.thumbnailUrl,
    title: r.title,
    categories: r.categories ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfólió</h1>
        <p className="text-muted-foreground">
          Linkeld be a TikTok/YouTube videóidat (előképpel jelennek meg), vagy
          tölts fel fotókat — húzással átrendezhető. A kiemelt bemutatkozó
          videót a Profil → Megjelenés fülön töltheted fel.
        </p>
      </div>
      <PortfolioManager initial={items} />
    </div>
  );
}
