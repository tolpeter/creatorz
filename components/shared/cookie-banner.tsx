"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, BarChart3, Megaphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  readConsent,
  writeConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  type ConsentCategories,
} from "@/lib/analytics/consent";

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Első látogatás: ha még nincs döntés, megjelenik a banner.
    if (!readConsent()) setOpen(true);

    // Bárhonnan újranyitható (pl. footer "Cookie beállítások").
    const reopen = () => {
      const c = readConsent();
      setAnalytics(c?.analytics ?? true);
      setMarketing(c?.marketing ?? false);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  function save(c: ConsentCategories) {
    writeConsent(c);
    setOpen(false);
    setDetails(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] text-white shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <Cookie className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold">Sütiket használunk</h2>
              <p className="mt-1 text-sm leading-6 text-white/60">
                A szükséges sütik a működéshez kellenek. Az engedélyeddel
                statisztikai sütiket is használunk, hogy névtelenül mérjük az
                oldal látogatottságát és fejleszthessük az élményt.{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  Részletek
                </Link>
              </p>
            </div>
          </div>

          {details && (
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <Row
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Szükséges"
                desc="Bejelentkezés, biztonság. Ezek nélkül az oldal nem működik."
                checked
                locked
              />
              <Row
                icon={<BarChart3 className="h-4 w-4" />}
                title="Statisztika"
                desc="Google Analytics — látogatottság mérése, anonimizált IP-vel."
                checked={analytics}
                onChange={setAnalytics}
              />
              <Row
                icon={<Megaphone className="h-4 w-4" />}
                title="Marketing"
                desc="Hirdetések személyre szabása. Jelenleg nincs aktív hirdetés."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            {!details ? (
              <>
                <Button
                  variant="outline"
                  className="order-3 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white sm:order-1"
                  onClick={() => save({ analytics: false, marketing: false })}
                >
                  Csak a szükséges
                </Button>
                <Button
                  variant="outline"
                  className="order-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setDetails(true)}
                >
                  Beállítások
                </Button>
                <Button
                  className="order-1 bg-accent font-bold text-black hover:bg-white sm:order-3"
                  onClick={() => save({ analytics: true, marketing: true })}
                >
                  Összes elfogadása
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => save({ analytics, marketing })}
                >
                  Kiválasztott mentése
                </Button>
                <Button
                  className="bg-accent font-bold text-black hover:bg-white"
                  onClick={() => save({ analytics: true, marketing: true })}
                >
                  Összes elfogadása
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  title,
  desc,
  checked,
  locked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {title}
            {locked && (
              <span className="ml-2 text-[11px] font-normal text-white/40">
                (mindig aktív)
              </span>
            )}
          </p>
          <p className="text-xs leading-5 text-white/50">{desc}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        disabled={locked}
        onCheckedChange={onChange}
        className="shrink-0"
      />
    </div>
  );
}
