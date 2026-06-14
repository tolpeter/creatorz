import Link from "next/link";
import {
  Mail,
  ArrowRight,
  Zap,
  Users,
  ShieldCheck,
  HelpCircle,
  FileText,
  Activity,
  Sparkles,
  Heart,
} from "lucide-react";
import { ContactForm } from "@/components/shared/contact-form";

export const metadata = {
  title: "Kapcsolat & Támogatás",
  description: "Kapcsolatfelvétel a Creatorz csapatával — info@creatorz.hu",
};

const FEATURES = [
  { icon: Zap, title: "Gyors válasz", desc: "24 órán belül" },
  { icon: Users, title: "Emberi támogatás", desc: "Valódi segítség" },
  { icon: ShieldCheck, title: "Megbízható partner", desc: "Márkáknak és alkotóknak" },
];

const HELP_LINKS = [
  { icon: HelpCircle, label: "GYIK és súgó", href: "/gyik" },
  { icon: FileText, label: "Szabályzatok", href: "/szabalyzat" },
  { icon: Activity, label: "Platform státusz", href: "/status", dot: true },
];

const VALUES = [
  { icon: Zap, title: "MODERN & TECH-FORWARD", desc: "Innovatív megoldások a kreatív iparnak." },
  { icon: Sparkles, title: "YOUTHFUL & PREMIUM", desc: "Energikus, prémium, mégis közvetlen." },
  { icon: Heart, title: "MADE FOR CREATORS", desc: "Kreatoroknak. Márkákkal. Együtt." },
];

export default function ContactPage() {
  return (
    <div
      className="relative -my-6 overflow-hidden bg-[#0a0a0a] text-white"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        width: "100vw",
      }}
    >
      {/* Háttér-ragyogások */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[460px] w-[460px] rounded-full bg-accent/15 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full bg-accent/15 blur-[150px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-1/4 hidden h-[600px] w-[600px] rounded-full border border-accent/15 lg:block"
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          {/* BAL OLDAL — info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Kapcsolat — Creatorz
            </p>
            <h1 className="mt-4 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Lépj kapcsolatba <span className="text-accent">velünk.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/60">
              Bármilyen kérdésed van a platformmal, együttműködéssel vagy
              technikai támogatással kapcsolatban, örömmel segítünk!
            </p>

            {/* Feature sor */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{f.title}</p>
                      <p className="text-xs text-white/45">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Email CTA */}
            <a
              href="mailto:info@creatorz.hu"
              className="group mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-accent/40"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold">Írj nekünk emailt</p>
                <p className="text-xs text-white/45">
                  Bármilyen kérdés, ötlet, problémabejelentés
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-accent">
                  info@creatorz.hu
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/40 text-accent transition-all group-hover:bg-accent group-hover:text-black">
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>

            {/* Gyakori segítség */}
            <div className="mt-8">
              <p className="text-lg font-bold">Gyakori segítség</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {HELP_LINKS.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.label}
                      href={l.href}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 transition-colors hover:border-accent/40 hover:text-white"
                    >
                      <Icon className="h-4 w-4 text-white/50" />
                      {l.label}
                      {l.dot && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* JOBB OLDAL — űrlap */}
          <div className="lg:pt-2">
            <ContactForm />
          </div>
        </div>

        {/* Alsó értékek sáv */}
        <div className="mt-12 grid gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:grid-cols-3 sm:gap-4 lg:mt-16">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em]">
                    {v.title}
                  </p>
                  <p className="text-xs text-white/45">{v.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
