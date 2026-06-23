import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, sql, gte } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Circle,
  ClipboardList,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  WandSparkles,
  Zap,
} from "lucide-react";
import { db } from "@/lib/db";
import { adApplications, messages, portfolioItems, profileViews } from "@/lib/db/schema";
import { getCurrentCreator, getCurrentUser } from "@/lib/auth";
import { resolveViewers } from "@/lib/viewers";
import { getOrCreateReferralCode, referralStats } from "@/lib/referral";
import { ViewersPanel, type ViewerRow } from "@/components/shared/viewers-panel";
import { ReferralCard, ProfileShareCard } from "@/components/creator/referral-cards";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardAvatarUpload } from "@/components/creator/dashboard-avatar-upload";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

export default async function CreatorOverviewPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");
  const p = creator.profile;

  const [portfolioRows, applicationRows, unreadRows, viewRows] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(portfolioItems)
      .where(eq(portfolioItems.creatorId, p.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(adApplications)
      .where(eq(adApplications.creatorId, p.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(eq(messages.toUserId, creator.appUserId), eq(messages.read, false)),
      ),
    db
      .select({
        total: sql<number>`count(*)::int`,
        brands: sql<number>`count(distinct ${profileViews.viewerUserId})::int`,
      })
      .from(profileViews)
      .where(
        and(
          eq(profileViews.creatorId, p.id),
          gte(profileViews.createdAt, new Date(Date.now() - 7 * 86400000)),
        ),
      ),
  ]);

  const portfolioCount = portfolioRows[0]?.n ?? 0;
  const weeklyViews = viewRows[0]?.total ?? 0;
  const weeklyViewBrands = viewRows[0]?.brands ?? 0;

  // "Kik nézték meg" — csak ha az admin bekapcsolta ennek a fióknak.
  const me = await getCurrentUser();
  const canSeeViewers = Boolean(me?.dbUser?.canSeeViewers);
  let viewerRows: ViewerRow[] = [];
  let anonymousViews = 0;
  if (canSeeViewers) {
    const grouped = await db
      .select({
        viewerUserId: profileViews.viewerUserId,
        lastAt: sql<Date>`max(${profileViews.createdAt})`,
        times: sql<number>`count(*)::int`,
      })
      .from(profileViews)
      .where(eq(profileViews.creatorId, p.id))
      .groupBy(profileViews.viewerUserId);
    anonymousViews = grouped
      .filter((g) => !g.viewerUserId)
      .reduce((sum, g) => sum + g.times, 0);
    const identified = grouped.filter(
      (g): g is typeof g & { viewerUserId: string } => Boolean(g.viewerUserId),
    );
    const identities = await resolveViewers(identified.map((g) => g.viewerUserId));
    viewerRows = identified
      .map((g) => {
        const identity = identities.get(g.viewerUserId);
        return identity
          ? { identity, lastAt: new Date(g.lastAt), times: g.times }
          : null;
      })
      .filter((v): v is ViewerRow => v !== null)
      .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
      .slice(0, 50);
  }
  const applicationCount = applicationRows[0]?.n ?? 0;
  const unreadCount = unreadRows[0]?.n ?? 0;

  // Ajánlási program + megosztható profil-kártya
  const [referralCode, refStats] = await Promise.all([
    getOrCreateReferralCode(creator.appUserId),
    referralStats(creator.appUserId),
  ]);
  const inviteUrl = `${APP_URL}/register?ref=${referralCode}`;
  const profileUrl = `${APP_URL}/creators/${p.username}`;

  const hasSocial = Boolean(
    p.instagramUrl ||
    p.tiktokUrl ||
    p.facebookUrl ||
    p.youtubeUrl ||
    p.instagramFollowers ||
    p.tiktokFollowers ||
    p.facebookFollowers ||
    p.youtubeSubscribers,
  );

  const setupItems = [
    {
      label: "Profilkép feltöltése",
      done: Boolean(p.avatarUrl),
      href: "/creator/profile",
      hint: "Egy valódi arc akár 3× több megkeresést hoz.",
    },
    {
      label: "Bemutatkozás (bio)",
      done: Boolean(p.bio && p.bio.trim().length >= 30),
      href: "/creator/profile",
      hint: "Írd le pár mondatban, kinek és mit készítesz.",
    },
    {
      label: "Kategóriák",
      done: (p.categories?.length ?? 0) > 0,
      href: "/creator/profile",
      hint: "Hogy a megfelelő márkák találjanak rád.",
    },
    {
      label: "Social csatornák",
      done: hasSocial,
      href: "/creator/profile",
      hint: "A hiteles követőszám több bizalmat ad a márkáknak.",
    },
    {
      label: "Portfólió",
      done: portfolioCount > 0,
      href: "/creator/portfolio",
      hint: "Mutasd meg a korábbi munkáidat.",
    },
    {
      label: "Bemutatkozó videó",
      done: Boolean(p.introVideoUrl),
      href: "/creator/portfolio",
      hint: "Akár 2× annyian írnak, ha van pitch-videód.",
    },
  ];

  const completedCount = setupItems.filter((item) => item.done).length;
  const profileScore = Math.round((completedCount / setupItems.length) * 100);
  const nextStep = setupItems.find((item) => !item.done);

  return (
    <div className="space-y-6">
      <section className="relative min-h-[320px] overflow-hidden rounded-lg bg-[#0A0A0A] text-white shadow-sm">
        <Image
          src="/images/generated/creatorz-creator-studio.webp"
          alt=""
          fill
          priority
          className="object-cover opacity-60"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.74) 48%, rgba(0,0,0,0.18) 100%), linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.76))",
          }}
        />
        <div className="relative grid min-h-[320px] gap-6 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-accent">
              <WandSparkles className="h-3.5 w-3.5" />
              Creator dashboard
            </span>
            <div className="mt-6 flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-white/25 bg-white/10">
                <AvatarImage src={p.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-white/10 text-white">
                  {p.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold tracking-tight sm:text-4xl">
                  {p.displayName}
                </h1>
                <p className="text-sm text-white/70">@{p.username}</p>
              </div>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
              Innen látod, mennyire készen áll a profilod a márkák előtt, és
              melyik lépés hozza a következő láthatósági ugrást.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href={nextStep?.href ?? "/ads"}>
                  {nextStep ? "Következő lépés" : "Új hirdetések keresése"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              >
                <Link href={`/creators/${p.username}`} target="_blank">
                  Publikus profil <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-black/50 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white/60">Profil erő</p>
                <p className="mt-1 text-4xl font-bold">{profileScore}%</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Zap className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${profileScore}%` }}
              />
            </div>
            {nextStep ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-white">
                  Következő lépés: {nextStep.label}
                </p>
                {"hint" in nextStep && nextStep.hint && (
                  <p className="mt-0.5 text-sm text-white/60">{nextStep.hint}</p>
                )}
                <Button
                  asChild
                  size="sm"
                  className="mt-3 bg-accent font-semibold text-black hover:bg-white"
                >
                  <Link href={nextStep.href}>
                    Folytatás <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/70">
                🎉 A profilod készen áll a megkeresésekre!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Profilkép feltöltés — külön, jól látható (csak ha még nincs) */}
      {!p.avatarUrl && (
        <div className="rounded-lg border border-accent/40 bg-accent/[0.06] p-5">
          <h2 className="text-base font-bold">Tölts fel egy profilképet</h2>
          <p className="mb-3 mt-0.5 text-sm text-muted-foreground">
            Egy valódi arc akár 3× több megkeresést hoz a márkáktól. Húzd ide a
            képet, vagy kattints a feltöltéshez.
          </p>
          <DashboardAvatarUpload initialUrl={p.avatarUrl ?? null} />
        </div>
      )}

      {/* Ki nézte a profilod (#5) */}
      <div className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-[#f6f7f2] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-[#3f6212]">
            <Eye className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">
              {weeklyViews > 0
                ? `${weeklyViews} profil-megtekintés a héten`
                : "Még senki sem nézte a profilod a héten"}
            </p>
            <p className="text-sm text-muted-foreground">
              {weeklyViewBrands > 0
                ? `${weeklyViewBrands} különböző látogatótól. Tartsd frissen a profilod, hogy többen megtaláljanak!`
                : "Tölts fel portfóliót és bemutatkozó videót, hogy a márkák rád találjanak."}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={`/creators/${p.username}`} target="_blank">
            Publikus profil <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {canSeeViewers && (
        <ViewersPanel
          viewers={viewerRows}
          anonymousCount={anonymousViews}
          emptyLabel="Még senki azonosítható nem nézte meg a profilodat."
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={<Star className="h-5 w-5" />}
          label="Átlag értékelés"
          value={p.averageRating ?? "—"}
          detail={`${p.reviewCount} értékelés alapján`}
        />
        <StatTile
          icon={<ImageIcon className="h-5 w-5" />}
          label="Portfólió"
          value={String(portfolioCount)}
          detail="feltöltött referencia"
        />
        <StatTile
          icon={<Send className="h-5 w-5" />}
          label="Pályázatok"
          value={String(applicationCount)}
          detail="leadott jelentkezés"
        />
        <StatTile
          icon={<MessageSquare className="h-5 w-5" />}
          label="Üzenetek"
          value={String(unreadCount)}
          detail="olvasatlan megkeresés"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Profil indítási checklist</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ezek adják a márkák első döntési pontjait.
              </p>
            </div>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-foreground">
              {completedCount}/{setupItems.length}
            </span>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {setupItems.map((item) => (
              <ChecklistLink key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-[#0A0A0A] p-5 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Következő jó húzás</h2>
              <p className="mt-1 text-sm text-white/70">
                {nextStep
                  ? "A profilod már látható, de ezzel a lépéssel sokkal könnyebb lesz dönteni rólad."
                  : "A profilod rendben. Itt az ideje aktív hirdetésekre pályázni."}
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/10 p-4">
            <p className="text-sm font-semibold text-accent">
              {nextStep?.label ?? "Pályázatok indítása"}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {nextStep
                ? "Nyisd meg, töltsd ki, majd térj vissza ide a készültségi állapothoz."
                : "Keress friss márka-hirdetéseket és küldj célzott ajánlatot."}
            </p>
          </div>
          <Button
            asChild
            className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link href={nextStep?.href ?? "/ads"}>
              Megnyitás <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReferralCard inviteUrl={inviteUrl} count={refStats.count} />
        <ProfileShareCard
          profileUrl={profileUrl}
          displayName={p.displayName}
          username={p.username}
          avatarUrl={p.avatarUrl ?? null}
        />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionLink
          href="/creator/profile"
          icon={<BadgeCheck className="h-5 w-5" />}
          title="Profil finomhangolása"
          description="Bio, kategóriák, social adatok és megjelenés."
        />
        <ActionLink
          href="/creator/portfolio"
          icon={<ImageIcon className="h-5 w-5" />}
          title="Portfólió építése"
          description="Mutasd meg a legjobb videókat és kampányanyagokat."
        />
        <ActionLink
          href="/creator/applications"
          icon={<ClipboardList className="h-5 w-5" />}
          title="Pályázatok követése"
          description="Nézd meg, hol tartanak a márkáknak küldött ajánlataid."
        />
      </section>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function ChecklistLink({
  label,
  done,
  href,
}: {
  label: string;
  done: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-3 text-sm transition-colors hover:border-accent/60"
    >
      <span className="flex items-center gap-2 font-medium">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-accent" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        {label}
      </span>
      <span className="text-xs text-muted-foreground">
        {done ? "Kész" : "Hiányzik"}
      </span>
    </Link>
  );
}

function ActionLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-card p-5 shadow-sm transition-all hover:border-accent/60 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
        {icon}
      </span>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
        Megnyitás
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
