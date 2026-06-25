import Link from "next/link";
import { ArrowRight, Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";

export type SeoRelatedLink = { label: string; href: string };

/**
 * Publikus, SEO-célú landing a tartalomgyártó-katalógusból (kategória / megye).
 * Indexelhető, márka-konverzióra optimalizált: H1 + bevezető + creator-rács +
 * brand CTA + kapcsolódó linkek (belső linkhálózat a SEO-hoz).
 */
export function SeoCreatorLanding({
  eyebrow,
  title,
  intro,
  creators,
  totalCount,
  related,
  relatedTitle,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  creators: CreatorCardData[];
  totalCount: number;
  related: SeoRelatedLink[];
  relatedTitle: string;
}) {
  return (
    <div className="space-y-10 py-2">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Főoldal
        </Link>{" "}
        <span aria-hidden>›</span>{" "}
        <Link href="/creators" className="hover:text-foreground">
          Alkotók
        </Link>{" "}
        <span aria-hidden>›</span> <span className="text-foreground">{eyebrow}</span>
      </nav>

      {/* Hero */}
      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-[#f0f4e5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f6212]">
          <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-4xl">{title}</h1>
        <p className="max-w-2xl text-muted-foreground">{intro}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-[#0a0a0a] font-semibold text-white hover:bg-accent hover:text-black">
            <Link href="/register">
              <Megaphone className="h-4 w-4" /> Márkaként briefet adok fel
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/creators">
              Összes tartalomgyártó <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Creator-rács */}
      {creators.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
          Ehhez még nincs megjeleníthető tartalomgyártó — de folyamatosan csatlakoznak újak.{" "}
          <Link href="/register" className="font-semibold text-[#4d7c0f] underline">
            Adj fel briefet
          </Link>
          , és értesítünk, amint van találat.
        </div>
      ) : (
        <section>
          <h2 className="mb-4 text-lg font-bold">
            {totalCount} tartalomgyártó {totalCount > creators.length ? `(az első ${creators.length})` : ""}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((c) => (
              <CreatorCard key={c.username} creator={c} />
            ))}
          </div>
        </section>
      )}

      {/* Kapcsolódó linkek — belső linkháló a SEO-hoz */}
      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {relatedTitle}
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:bg-accent/10"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Brand CTA sáv */}
      <section className="rounded-[1.75rem] border border-black/10 bg-[#070807] p-7 text-white sm:p-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">Találd meg a megfelelő alkotót</h2>
            <p className="mt-1 max-w-xl text-sm text-white/70">
              Adj fel egy briefet ingyen, és a hozzád illő tartalomgyártók jelentkeznek.
              Hiteles statok, értékelések, gyors kapcsolatfelvétel.
            </p>
          </div>
          <Button asChild className="shrink-0 rounded-full bg-accent font-black text-black hover:bg-accent/90">
            <Link href="/register">
              Ingyenes brieffeladás <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
