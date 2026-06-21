import Link from "next/link";
import { ArrowRight, UserRound, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { MobileNavMenu } from "@/components/layout/mobile-nav-menu";

const LINKS = [
  { label: "Alkotók", href: "/creators" },
  { label: "Márkák", href: "/#markak" },
  { label: "Hogyan működik", href: "/#hogyan" },
  { label: "Hirdetések", href: "/ads" },
  { label: "Aktuális fejlesztések", href: "/status" },
  { label: "Blog", href: "/blog" },
  { label: "Kapcsolat", href: "/kapcsolat" },
] as const;

// Az "Alkotók" menüpont dropdown-elemei (típus-szűrt directory linkek)
const CREATOR_TYPE_LINKS = [
  { label: "Összes alkotó", href: "/creators" },
  { label: "UGC tartalomgyártók", href: "/creators?tipus=ugc" },
  { label: "Videóvágók", href: "/creators?tipus=editor" },
  { label: "Fotósok", href: "/creators?tipus=photographer" },
  { label: "Operatőrök", href: "/creators?tipus=videographer" },
] as const;

export function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const authCtas = isLoggedIn
    ? [{ label: "Profilom", href: "/dashboard" }]
    : [
        { label: "Belépés", href: "/login", variant: "secondary" as const },
        { label: "Regisztráció", href: "/register" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Creatorz főoldal">
          <Logo variant="light" className="text-2xl" />
        </Link>

        <nav className="hidden items-center gap-5 whitespace-nowrap text-[15px] font-medium text-white/70 lg:flex xl:gap-7">
          {LINKS.map((link) =>
            link.href === "/creators" ? (
              // "Alkotók" — CSS-hover dropdown a típusokkal
              <div key={link.label} className="group relative">
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1 py-4 transition-colors hover:text-accent"
                >
                  {link.label}
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </Link>
                <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-2 opacity-0 shadow-2xl backdrop-blur-xl transition-all group-hover:visible group-hover:opacity-100">
                  {CREATOR_TYPE_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-xl px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-accent hover:text-black"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : link.href === "/status" ? (
              <Link
                key={link.label}
                href={link.href}
                className="group/dev inline-flex items-center gap-1.5 whitespace-nowrap text-accent transition-colors hover:text-accent/80"
              >
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Button
              asChild
              size="lg"
              className="h-11 rounded-full bg-accent px-4 text-sm font-bold text-black shadow-[0_0_38px_rgba(163,230,53,0.34)] hover:bg-white sm:px-7"
            >
              <Link href="/dashboard">
                Profilom <UserRound className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-full border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white hover:text-black"
              >
                <Link href="/login">Belépés</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-11 rounded-full bg-accent px-5 text-sm font-bold text-black shadow-[0_0_38px_rgba(163,230,53,0.34)] hover:bg-white sm:px-6"
              >
                <Link href="/register">
                  Regisztráció <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}

          <MobileNavMenu
            theme="dark"
            showClass="lg:hidden"
            links={LINKS.map((link) => ({
              label: link.label,
              href: link.href,
            }))}
            ctas={authCtas}
          />
        </div>
      </div>
    </header>
  );
}
