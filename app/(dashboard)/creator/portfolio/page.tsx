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
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">
          Videók és fotók — húzással átrendezhető.
        </p>
      </div>
      <PortfolioManager initial={items} />
    </div>
  );
}
