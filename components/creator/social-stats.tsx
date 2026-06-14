import { BadgeCheck, ArrowUpRight, Users } from "lucide-react";
import { SocialTile, type Platform } from "@/components/creator/platform-icon";
import { formatNumber, formatHuDate } from "@/lib/utils/format";

type Row = {
  platform: Platform;
  name: string;
  url: string | null;
  count: number | null;
  unit: string;
  verified: boolean;
  lastChecked: Date | null;
};

export function SocialStats({
  profile,
}: {
  profile: {
    instagramUrl: string | null;
    instagramFollowers: number | null;
    instagramVerified: boolean;
    instagramLastChecked: Date | null;
    tiktokUrl: string | null;
    tiktokFollowers: number | null;
    tiktokVerified: boolean;
    tiktokLastChecked: Date | null;
    facebookUrl: string | null;
    facebookFollowers: number | null;
    facebookVerified: boolean;
    facebookLastChecked: Date | null;
    youtubeUrl: string | null;
    youtubeSubscribers: number | null;
    youtubeVerified: boolean;
    youtubeLastChecked: Date | null;
  };
}) {
  const rows: Row[] = [
    {
      platform: "tiktok",
      name: "TikTok",
      url: profile.tiktokUrl,
      count: profile.tiktokFollowers,
      unit: "követő",
      verified: profile.tiktokVerified,
      lastChecked: profile.tiktokLastChecked,
    },
    {
      platform: "instagram",
      name: "Instagram",
      url: profile.instagramUrl,
      count: profile.instagramFollowers,
      unit: "követő",
      verified: profile.instagramVerified,
      lastChecked: profile.instagramLastChecked,
    },
    {
      platform: "youtube",
      name: "YouTube",
      url: profile.youtubeUrl,
      count: profile.youtubeSubscribers,
      unit: "feliratkozó",
      verified: profile.youtubeVerified,
      lastChecked: profile.youtubeLastChecked,
    },
    {
      platform: "facebook",
      name: "Facebook",
      url: profile.facebookUrl,
      count: profile.facebookFollowers,
      unit: "követő",
      verified: profile.facebookVerified,
      lastChecked: profile.facebookLastChecked,
    },
  ];

  const visible = rows.filter(
    (r): r is Row & { url: string; count: number } =>
      Boolean(r.url) && typeof r.count === "number" && r.count > 0,
  );
  if (visible.length === 0) {
    return null;
  }

  const totalReach = visible.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-3">
      {/* Összes elérés kiemelt fejléc */}
      <div className="rounded-2xl bg-[#0b0d0a] p-4 text-white">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
          <Users className="h-3.5 w-3.5 text-accent" />
          Összes elérés
        </p>
        <p className="mt-1 text-3xl font-black text-accent">
          {formatNumber(totalReach)}
        </p>
        <p className="text-xs text-white/55">
          {visible.length} platformon összesen
        </p>
      </div>

      {/* Platform-kártyák márka-ikonnal */}
      {visible.map((r) => {
        const inner = (
          <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <SocialTile platform={r.platform} className="h-11 w-11" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                {r.name}
                {r.verified && <BadgeCheck className="h-4 w-4 text-accent" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.lastChecked
                  ? `Frissítve: ${formatHuDate(r.lastChecked)}`
                  : "Frissítés folyamatban"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black leading-none">{formatNumber(r.count)}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{r.unit}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </div>
        );
        return r.url ? (
          <a
            key={r.name}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            {inner}
          </a>
        ) : (
          <div key={r.name} className="group">
            {inner}
          </div>
        );
      })}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BadgeCheck className="h-3.5 w-3.5 text-accent" />
        A követőszámokat automatikus, rendszeres ellenőrzéssel hitelesítjük.
      </p>
    </div>
  );
}
