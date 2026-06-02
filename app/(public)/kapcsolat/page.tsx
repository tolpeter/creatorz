import { Mail, MessageCircle, HelpCircle, Clock } from "lucide-react";

export const metadata = {
  title: "Kapcsolat & Támogatás",
  description: "Kapcsolatfelvétel a Creatorz csapatával — info@creatorz.hu",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 py-12">
      {/* HERO */}
      <div className="space-y-3 text-center">
        <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          Itt vagyunk neked
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Kapcsolat &amp; Támogatás
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Kérdésed van? Visszajelzésed? Hibát találtál? Írj nekünk bármikor — 24
          órán belül válaszolunk.
        </p>
      </div>

      {/* PRIMÁRY EMAIL CTA */}
      <div className="relative overflow-hidden rounded-3xl border bg-card p-8 text-center shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
            <Mail className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-xl font-bold">Írj nekünk emailt</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bármilyen kérdés, ötlet, problémabejelentés
          </p>
          <a
            href="mailto:info@creatorz.hu"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-accent-foreground transition-all hover:scale-105 hover:bg-accent/90 hover:shadow-[0_0_24px_rgba(163,230,53,0.4)]"
          >
            <Mail className="h-4 w-4" />
            info@creatorz.hu
          </a>
        </div>
      </div>

      {/* FEATURE GRID */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={<Clock className="h-5 w-5 text-accent" />}
          title="Gyors válasz"
          desc="Munkanapokon 24 órán belül"
        />
        <FeatureCard
          icon={<MessageCircle className="h-5 w-5 text-accent" />}
          title="Magyar nyelven"
          desc="Magyar csapat, magyar ügyfélszolgálat"
        />
        <FeatureCard
          icon={<HelpCircle className="h-5 w-5 text-accent" />}
          title="Bármilyen kérdés"
          desc="Regisztráció, fizetés, együttműködés"
        />
      </div>

      {/* FOOTER LINKS */}
      <div className="space-y-2 border-t pt-8 text-center text-sm text-muted-foreground">
        <p>
          Üzenetküldés a platformon belül: bejelentkezés után a{" "}
          <strong>Üzenetek</strong> menüpont.
        </p>
        <p>
          Adatkezeléssel kapcsolatos kérdés:{" "}
          <a href="/adatvedelem" className="text-accent underline">
            Adatvédelmi tájékoztató
          </a>
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 text-center transition-colors hover:border-accent/40">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
        {icon}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
