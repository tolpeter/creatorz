"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSetting } from "@/app/actions/admin";
import type { SettingsMap } from "@/lib/settings";

export function AdminSettingsForm({ initial }: { initial: SettingsMap }) {
  const [s, setS] = useState<SettingsMap>(initial);
  const [, startTransition] = useTransition();

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

  const toggles: Array<{ key: keyof SettingsMap; label: string; desc: string }> = [
    { key: "creator_subscription_enabled", label: "Creator előfizetés kötelező", desc: "Ha be van kapcsolva, a creatoroknak fizetniük kell." },
    { key: "registration_enabled", label: "Regisztráció engedélyezve", desc: "Új fiókok létrehozása." },
    { key: "auto_approve_creators", label: "Creatorok automatikus jóváhagyása", desc: "" },
    { key: "auto_approve_brands", label: "Márkák automatikus jóváhagyása", desc: "" },
    { key: "auto_approve_ads", label: "Hirdetések automatikus jóváhagyása", desc: "" },
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
                <Input
                  type="number"
                  value={String(s[n.key])}
                  onChange={(e) => setS((prev) => ({ ...prev, [n.key]: Number(e.target.value) }))}
                />
              </div>
              <Button variant="outline" onClick={() => saveNum(n.key)}>
                Mentés
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
