import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { CookieSettingsButton } from "@/components/shared/cookie-settings-button";
import { NewsletterForm } from "@/components/shared/newsletter-form";

export function SiteFooter() {
  const cols = [
    {
      title: "Termék",
      links: [
        { href: "/creators", label: "Tartalomgyártók" },
        { href: "/#markak", label: "Márkák" },
        { href: "/ads", label: "Hirdetések" },
        { href: "/#hogyan", label: "Hogyan működik" },
        { href: "/blog", label: "Blog" },
      ],
    },
    {
      title: "Cégeknek",
      links: [
        { href: "/register", label: "Regisztráció" },
        { href: "/creators", label: "Tartalomgyártó keresés" },
        { href: "/ads", label: "Hirdetésfeladás" },
      ],
    },
    {
      title: "Tartalomgyártóknak",
      links: [
        { href: "/register", label: "Csatlakozás" },
        { href: "/ads", label: "Pályázható hirdetések" },
      ],
    },
    {
      title: "Súgó",
      links: [
        { href: "/gyik", label: "GYIK és súgó" },
        { href: "/status", label: "Platform státusz" },
        { href: "/kapcsolat", label: "Kapcsolat" },
      ],
    },
    {
      title: "Jogi",
      links: [
        { href: "/szabalyzat", label: "Szabályzatok" },
        { href: "/aszf", label: "ÁSZF" },
        { href: "/adatvedelem", label: "Adatvédelem" },
        { href: "/cookies", label: "Cookie" },
      ],
    },
  ];

  return (
    <footer className="border-t bg-[#0A0A0A] text-white/70">
      {/* Hírlevél-feliratkozás */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="md:max-w-md">
            <p className="text-lg font-black text-white">
              Iratkozz fel a hírlevélre
            </p>
            <p className="mt-1 text-sm text-white/60">
              Új funkciók, tippek és a mobil app indulása — egyenesen a
              postaládádba.
            </p>
          </div>
          <div className="w-full md:max-w-md">
            <NewsletterForm source="footer" variant="dark" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="light" className="text-xl" />
          <p className="mt-2 text-sm">Magyar UGC tartalomgyártó platform.</p>
          <a
            href="mailto:info@creatorz.hu"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            info@creatorz.hu
          </a>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-sm font-semibold text-white">{c.title}</p>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center gap-1 border-t border-white/10 px-6 py-4 text-center text-xs sm:flex-row sm:gap-2">
        <span>© {new Date().getFullYear()} Creatorz · Minden jog fenntartva</span>
        <span className="hidden sm:inline">·</span>
        <CookieSettingsButton className="hover:text-accent" />
      </div>
    </footer>
  );
}
