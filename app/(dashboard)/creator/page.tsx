import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { Sparkles, Star, ImageIcon, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { portfolioItems } from "@/lib/db/schema";
import { getCurrentCreator } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function CreatorOverviewPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");
  const p = creator.profile;

  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, p.id));
  const portfolioCount = countRows[0]?.n ?? 0;

  const profileIncomplete = (p.categories?.length ?? 0) === 0 || (p.rateCard?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={p.avatarUrl ?? undefined} />
          <AvatarFallback>{p.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{p.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{p.username}</p>
        </div>
      </div>

      {profileIncomplete && (
        <Card className="border-accent">
          <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="font-medium">Fejezd be a profilod!</p>
                <p className="text-sm text-muted-foreground">
                  Adj meg kategóriákat és rate card-ot, hogy a márkák megtaláljanak.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/onboarding/creator">Profil befejezése</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Star className="h-5 w-5 text-accent" />} label="Átlag értékelés" value={p.averageRating ?? "—"} />
        <StatCard icon={<Star className="h-5 w-5 text-accent" />} label="Értékelések" value={String(p.reviewCount)} />
        <StatCard icon={<ImageIcon className="h-5 w-5 text-accent" />} label="Portfolio elem" value={String(portfolioCount)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/creator/profile">Profil szerkesztése</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/creator/portfolio">Portfolio kezelése</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/creators/${p.username}`} target="_blank">
            Publikus profil <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
