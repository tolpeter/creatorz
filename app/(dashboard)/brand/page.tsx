import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { Search, Heart, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { savedCreators } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BrandOverviewPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const savedRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(savedCreators)
    .where(eq(savedCreators.brandId, brand.profile.id));
  const savedCount = savedRows[0]?.n ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{brand.profile.companyName}</h1>
        <p className="text-muted-foreground">Márka irányítópult</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Heart className="h-5 w-5 text-accent" /> Mentett tartalomgyártók
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{savedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Search className="h-5 w-5 text-accent" /> Tartalomgyártók keresése
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/creators">Böngészés indítása</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/brand/profile">
            <Building2 className="h-4 w-4" /> Cég profil
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/brand/saved">Mentett tartalomgyártók</Link>
        </Button>
      </div>
    </div>
  );
}
