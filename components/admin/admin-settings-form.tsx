"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSetting, testFacebookConnection } from "@/app/actions/admin";
import type { LegalEntityType, SettingsMap } from "@/lib/settings";

export function AdminSettingsForm({ initial }: { initial: SettingsMap }) {
  const [s, setS] = useState<SettingsMap>(initial);
  const [, startTransition] = useTransition();
  const [fbTesting, setFbTesting] = useState(false);
  const [fbResult, setFbResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function runFbTest() {
    setFbTesting(true);
    setFbResult(null);
    try {
      const res = await testFacebookConnection();
      if (res.ok) {
        setFbResult({
          ok: true,
          text: `Sikeres! Kiment egy teszt-poszt${res.pageName ? ` a(z) „${res.pageName}” oldalra` : ""}. Nézd meg a Facebook-oldalon (a teszt-bejegyzés törölhető).`,
        });
        toast.success("Facebook kapcsolat OK");
      } else {
        const envInfo = `FB_PAGE_ID: ${res.env.pageId ? "megvan" : "HIÁNYZIK"}, FB_PAGE_ACCESS_TOKEN: ${res.env.token ? "megvan" : "HIÁNYZIK"}`;
        setFbResult({
          ok: false,
          text: `Hiba (${res.step ?? "?"}): ${res.error ?? "ismeretlen"} — ${envInfo}`,
        });
        toast.error("Facebook kapcsolat hiba");
      }
    } catch (e) {
      setFbResult({ ok: false, text: `Váratlan hiba: ${(e as Error).message}` });
      toast.error("Hiba a teszt közben");
    } finally {
      setFbTesting(false);
    }
  }

  function saveBool(key: keyof SettingsMap, value: boolean) {
    setS((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const res = await updateSetting(key, value);
      if (res.error) toast.error(res.error);
      else toast.success("Mentve");
    });
  }

  function saveNum(key: keyof SettingsMap) {
    startTransition(async () => {
      const res = await updateSetting(key, Number(s[key]));
      if (res.error) toast.error(res.error);
      else toast.success("Mentve");
    });
  }

  function saveStr(key: keyof SettingsMap) {
    startTransition(async () => {
      const res = await updateSetting(key, String(s[key] ?? ""));
      if (res.error) toast.error(res.error);
      else toast.success("Mentve");
    });
  }

  function setLegalType(value: LegalEntityType) {
    setS((prev) => ({ ...prev, legal_entity_type: value }));
    startTransition(async () => {
      const res = await updateSetting("legal_entity_type", value);
      if (res.error) toast.error(res.error);
      else toast.success("Jogi típus frissítve — a jogi oldalak átálltak");
    });
  }

  const toggles: Array<{ key: keyof SettingsMap; label: string; desc: string }> = [
    { key: "creator_subscription_enabled", label: "Tartalomgyártó előfizetés kötelező", desc: "Ha be van kapcsolva, a tartalomgyártóknak fizetniük kell." },
    { key: "registration_enabled", label: "Regisztráció engedélyezve", desc: "Új fiókok létrehozása." },
    { key: "auto_approve_creators", label: "Tartalomgyártók automatikus jóváhagyása", desc: "" },
    { key: "auto_approve_brands", label: "Márkák automatikus jóváhagyása", desc: "" },
    { key: "auto_approve_ads", label: "Kampányok automatikus jóváhagyása", desc: "" },
    { key: "public_view_creators", label: "Tartalomgyártók-lista nyilvános", desc: "Ha ki van kapcsolva, csak bejelentkezett felhasználó látja a /creators oldalt." },
    { key: "public_view_ads", label: "Kampányok-lista nyilvános", desc: "Ha ki van kapcsolva, csak bejelentkezett felhasználó látja a /ads oldalt." },
    { key: "mobile_app_popup_enabled", label: "Mobil-app popup a főoldalon", desc: "„Hamarosan elérhető a Creatorz mobil app” felugró ablak a kezdőlapon (Android + iOS)." },
    { key: "analytics_enabled", label: "Látogatottság-mérés (Analytics)", desc: "Google Analytics / Tag Manager betöltése. Csak akkor működik, ha a NEXT_PUBLIC_GA_ID vagy NEXT_PUBLIC_GTM_ID is be van állítva." },
    { key: "fb_autopost_enabled", label: "Facebook auto-poszt kampányokról", desc: "Kampány jóváhagyásakor automatikusan poszt készül a Creatorz Facebook-oldalra (AI-szöveg + link + borítókép). Csak akkor működik, ha az FB_PAGE_ID és FB_PAGE_ACCESS_TOKEN env be van állítva." },
  ];

  const numbers: Array<{ key: keyof SettingsMap; label: string }> = [
    { key: "creator_subscription_price_huf", label: "Havi előfizetés ára (Ft)" },
    { key: "feature_7day_price_huf", label: "7 napos kiemelés ára (Ft)" },
    { key: "feature_30day_price_huf", label: "30 napos kiemelés ára (Ft)" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kapcsolók</CardTitle>
          <CardDescription>A változás azonnal mentődik.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-4">
              <div>
                <Label>{t.label}</Label>
                {t.desc && <p className="text-xs text-muted-foreground">{t.desc}</p>}
              </div>
              <Switch
                checked={!!s[t.key]}
                onCheckedChange={(v) => saveBool(t.key, v)}
              />
            </div>
          ))}

          <div className="mt-2 space-y-2 rounded-lg border border-black/10 bg-[#f6f7f2] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Facebook kapcsolat tesztelése</Label>
                <p className="text-xs text-muted-foreground">
                  Kitesz egy törölhető teszt-posztot a Creatorz oldalra, és megmutatja a pontos
                  hibát, ha valami nincs rendben (env, token, jogosultság).
                </p>
              </div>
              <Button variant="outline" onClick={runFbTest} disabled={fbTesting}>
                {fbTesting ? "Tesztelés…" : "Teszt"}
              </Button>
            </div>
            {fbResult && (
              <p
                className={`text-xs ${fbResult.ok ? "text-green-700" : "text-red-600"}`}
              >
                {fbResult.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Árak</CardTitle>
          <CardDescription>
            A kijelzett árak. (A tényleges Stripe-terheléshez a Stripe Price ID-k tartoznak.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {numbers.map((n) => (
            <div key={n.key} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>{n.label}</Label>
                <NumberInput
                  value={String(s[n.key])}
                  onChange={(raw) => setS((prev) => ({ ...prev, [n.key]: Number(raw || 0) }))}
                />
              </div>
              <Button variant="outline" onClick={() => saveNum(n.key)}>
                Mentés
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jogi adatok (Adatkezelő)</CardTitle>
          <CardDescription>
            Az itt megadott adatok automatikusan megjelennek az
            Adatkezelési tájékoztatóban, az ÁSZF-ben és a Cookie tájékoztatóban.
            Élesedéskor (magánszemély → EV → KFT) csak a típust kapcsold át,
            töltsd ki az új mezőket — a jogi oldalak azonnal átálltak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Adatkezelő típusa</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={s.legal_entity_type}
              onChange={(e) => setLegalType(e.target.value as LegalEntityType)}
            >
              <option value="individual">Magánszemély adatkezelő</option>
              <option value="ev">Egyéni vállalkozó (EV)</option>
              <option value="kft">Korlátolt felelősségű társaság (KFT)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              A magánszemély típusnál a /aszf oldal címe automatikusan
              „Felhasználási feltételek" lesz (mert nincs fizetős szerződéses
              szolgáltatás).
            </p>
          </div>

          {(
            [
              { key: "legal_name", label: "Név" },
              { key: "legal_address", label: "Cím / Székhely" },
              { key: "legal_email", label: "Kapcsolat email" },
            ] as const
          ).map((n) => (
            <div key={n.key} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>{n.label}</Label>
                <Input
                  value={String(s[n.key] ?? "")}
                  onChange={(e) =>
                    setS((prev) => ({ ...prev, [n.key]: e.target.value }))
                  }
                />
              </div>
              <Button variant="outline" onClick={() => saveStr(n.key)}>
                Mentés
              </Button>
            </div>
          ))}

          {s.legal_entity_type !== "individual" && (
            <div className="space-y-4 rounded-lg border border-black/10 bg-[#f6f7f2] p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                {s.legal_entity_type === "ev"
                  ? "Egyéni vállalkozó adatai"
                  : "Cég adatai"}
              </p>
              {(
                [
                  { key: "legal_tax_id", label: "Adószám" },
                  ...(s.legal_entity_type === "ev"
                    ? ([
                        {
                          key: "legal_ev_reg_number",
                          label: "EV nyilvántartási szám",
                        },
                      ] as const)
                    : ([
                        { key: "legal_kft_court", label: "Cégbíróság" },
                        { key: "legal_kft_reg_number", label: "Cégjegyzékszám" },
                      ] as const)),
                ] as const
              ).map((n) => (
                <div key={n.key} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label>{n.label}</Label>
                    <Input
                      value={String(s[n.key] ?? "")}
                      onChange={(e) =>
                        setS((prev) => ({ ...prev, [n.key]: e.target.value }))
                      }
                    />
                  </div>
                  <Button variant="outline" onClick={() => saveStr(n.key)}>
                    Mentés
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>NAIH bejelentési szám (opcionális)</Label>
              <Input
                value={String(s.legal_naih_id ?? "")}
                onChange={(e) =>
                  setS((prev) => ({ ...prev, legal_naih_id: e.target.value }))
                }
              />
            </div>
            <Button variant="outline" onClick={() => saveStr("legal_naih_id")}>
              Mentés
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
