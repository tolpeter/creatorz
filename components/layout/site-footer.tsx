import Link from "next/link";

export function SiteFooter() {
  const cols = [
    {
      title: "Termék",
      links: [
        { href: "/creators", label: "Creatorok" },
        { href: "/ads", label: "Hirdetések" },
        { href: "/#hogyan", label: "Hogyan működik" },
      ],
    },
    {
      title: "Cégeknek",
      links: [
        { href: "/register", label: "Regisztráció" },
        { href: "/creators", label: "Creator keresés" },
        { href: "/ads", label: "Hirdetésfeladás" },
      ],
    },
    {
      title: "Creatoroknak",
      links: [
        { href: "/register", label: "Csatlakozás" },
        { href: "/ads", label: "Pályázható hirdetések" },
      ],
    },
    {
      title: "Jogi",
      links: [
        { href: "/about", label: "Adatvédelem" },
        { href: "/about", label: "ÁSZF" },
        { href: "/about", label: "Kapcsolat" },
      ],
    },
  ];

  return (
    <footer className="border-t bg-[#0A0A0A] text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-5">
        <div className="md:col-span-1">
          <span className="text-xl font-bold text-white">
            creatorz<span className="text-accent">.</span>
          </span>
          <p className="mt-2 text-sm">Magyar UGC tartalomgyártó platform.</p>
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
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs">
        © {new Date().getFullYear()} Creatorz · Minden jog fenntartva
      </div>
    </footer>
  );
}
