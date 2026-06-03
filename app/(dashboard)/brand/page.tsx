import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import {
  Search,
  Heart,
  Building2,
  Sparkles,
  Megaphone,
  MessageSquare,
  ArrowRight,
  Plus,
} from "lucide-react";
import { db } from "@/lib/db";
import { savedCreators, ads, messages } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function BrandOverviewPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const [savedRows, activeAdsRows, unreadRows] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(savedCreators)
      .where(eq(savedCreators.brandId, brand.profile.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(ads)
      .where(and(eq(ads.brandId, brand.profile.id), eq(ads.status, "active"))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(messages)
      .where(and(eq(messages.toUserId, brand.appUserId), eq(messages.read, false))),
  ]);

  const savedCount = savedRows[0]?.n ?? 0;
  const activeAdsCount = activeAdsRows[0]?.n ?? 0;
  const unreadCount = unreadRows[0]?.n ?? 0;

  return (
    <div className="space-y-6">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15">
            <Sparkles className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{brand.profile.companyName}</h1>
            <p className="text-muted-foreground">Márka irányítópult</p>
          </div>
        </div>
      </div>

      {/* FELSŐ 2 STAT KÁRTYA */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Mentett tartalomgyártók */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
              <Heart className="h-7 w-7 text-accent" />
            </div>
            <svg
              viewBox="0 0 80 32"
              className="h-8 w-20 text-accent/60"
              preserveAspectRatio="none"
            >
              <path
                d="M0,24 Q12,8 24,16 T48,12 T80,6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground">
              Mentett tartalomgyártók
            </p>
            <p className="mt-1 text-4xl font-bold">{savedCount}</p>
            <p className="mt-1 text-xs text-accent">
              +0 az előző héthez képest
            </p>
          </div>
        </div>

        {/* Tartalomgyártók keresése */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
            <Search className="h-7 w-7 text-accent" />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Tartalomgyártók keresése
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Találd meg a tökéletes partnereket a kampányaidhoz.
              </p>
            </div>
            <Button asChild className="shrink-0 bg-foreground text-background hover:bg-foreground/90">
              <Link href="/creators">
                Böngészés indítása <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* GYORS ELÉRÉSEK */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Gyors elérések</h2>
        <div className="flex flex-wrap gap-3">
          <QuickAction
            icon={<Building2 className="h-4 w-4" />}
            href="/brand/profile"
            label="Cég profil"
          />
          <QuickAction
            icon={<Heart className="h-4 w-4" />}
            href="/brand/saved"
            label="Mentett tartalomgyártók"
          />
          <QuickAction
            icon={<MessageSquare className="h-4 w-4" />}
            href="/brand/messages"
            label="Üzenetek"
            badge={unreadCount > 0 ? unreadCount : undefined}
          />
        </div>
      </div>

      {/* ALSÓ KÁRTYÁK: hirdetések + üzenetek */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Aktív hirdetések */}
        <div className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Megaphone className="h-5 w-5 text-accent" />
            Aktív hirdetéseim
          </div>
          <p className="text-4xl font-bold">{activeAdsCount}</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {activeAdsCount === 0
                ? "Jelenleg nincs aktív hirdetésed."
                : `${activeAdsCount} hirdetés él jelenleg`}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/brand/ads/new">
                <Plus className="h-4 w-4" /> Új hirdetés
              </Link>
            </Button>
          </div>
        </div>

        {/* Üzenetek */}
        <div className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessageSquare className="h-5 w-5 text-accent" />
            Üzenetek
            {unreadCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-4xl font-bold">{unreadCount}</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {unreadCount === 0
                ? "Nincs új üzeneted."
                : `${unreadCount} olvasatlan üzenet`}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/brand/messages">
                Megnyitás <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  href,
  label,
  badge,
}: {
  icon: React.ReactNode;
  href: string;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-all hover:border-accent/60 hover:shadow-sm"
    >
      <span className="text-accent">{icon}</span>
      {label}
      <ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      {badge != null && (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
