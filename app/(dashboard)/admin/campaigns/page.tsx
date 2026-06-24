import { Mail, Eye, MousePointerClick, ImageIcon, Send } from "lucide-react";
import { getCampaignStats } from "@/app/actions/campaigns";

export const metadata = { title: "Admin — Email kampányok" };
export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  "profile-photo-2026-06": "Profilkép-ösztönző",
};

function pct(part: number, whole: number) {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AdminCampaignsPage() {
  const stats = await getCampaignStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email kampányok</h1>
        <p className="text-muted-foreground">
          Megnyitás, kattintás és konverzió (feltöltött profilkép) kampányonként.
        </p>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          <Mail className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          Még nincs kiküldött kampány. Indítsd a{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            scripts/send-profile-photo-campaign.mjs
          </code>{" "}
          scripttel.
        </div>
      ) : (
        <div className="space-y-5">
          {stats.map((s) => {
            const tiles = [
              { label: "Kiküldve", value: s.sent, sub: `${s.total} címzett`, icon: Send },
              { label: "Megnyitotta", value: s.opened, sub: pct(s.opened, s.sent), icon: Eye },
              { label: "Kattintott", value: s.clicked, sub: pct(s.clicked, s.sent), icon: MousePointerClick },
              { label: "Feltöltött képet", value: s.converted, sub: pct(s.converted, s.sent), icon: ImageIcon },
            ];
            return (
              <div key={s.campaign} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold">{LABELS[s.campaign] ?? s.campaign}</p>
                    <p className="text-xs text-muted-foreground">{s.campaign}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {tiles.map((t) => {
                    const Icon = t.icon;
                    return (
                      <div key={t.label} className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" /> {t.label}
                        </div>
                        <p className="text-2xl font-black text-[#3f6212]">{t.value}</p>
                        <p className="text-[11px] text-muted-foreground">{t.sub}</p>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-[11px] text-muted-foreground">
                  A „Feltöltött képet" azt mutatja, hány megcélzott tartalomgyártónak van MOST
                  profilképe — irányadó konverzió, nem szigorúan ennek az emailnek tulajdonítva.
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
