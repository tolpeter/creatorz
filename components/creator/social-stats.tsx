import { Camera, Music2, Users, Play, ExternalLink } from "lucide-react";
import { formatNumber, formatHuDate } from "@/lib/utils/format";

type Platform = {
  name: string;
  icon: React.ReactNode;
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
  const platforms: Platform[] = [
    {
      name: "Instagram",
      icon: <Camera className="h-5 w-5" />,
      url: profile.instagramUrl,
      count: profile.instagramFollowers,
      unit: "követő",
      verified: profile.instagramVerified,
      lastChecked: profile.instagramLastChecked,
    },
    {
      name: "TikTok",
      icon: <Music2 className="h-5 w-5" />,
      url: profile.tiktokUrl,
      count: profile.tiktokFollowers,
      unit: "követő",
      verified: profile.tiktokVerified,
      lastChecked: profile.tiktokLastChecked,
    },
    {
      name: "Facebook",
      icon: <Users className="h-5 w-5" />,
      url: profile.facebookUrl,
      count: profile.facebookFollowers,
      unit: "követő",
      verified: profile.facebookVerified,
      lastChecked: profile.facebookLastChecked,
    },
    {
      name: "YouTube",
      icon: <Play className="h-5 w-5" />,
      url: profile.youtubeUrl,
      count: profile.youtubeSubscribers,
      unit: "feliratkozó",
      verified: profile.youtubeVerified,
      lastChecked: profile.youtubeLastChecked,
    },
  ];

  const visible = platforms.filter((p) => p.url || p.count != null);
  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nincs megadott közösségi platform.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((p) => {
        const inner = (
          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{p.icon}</span>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium">
                  {p.name}
                  {p.verified && <span className="text-accent">✓</span>}
                  {p.url && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                </p>
                {p.lastChecked && (
                  <p className="text-xs text-muted-foreground">
                    Frissítve: {formatHuDate(p.lastChecked)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {p.count != null ? formatNumber(p.count) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{p.unit}</p>
            </div>
          </div>
        );
        return p.url ? (
          <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="block">
            {inner}
          </a>
        ) : (
          <div key={p.name}>{inner}</div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        A követőszámokat automatikus napi ellenőrzéssel frissítjük.
      </p>
    </div>
  );
}
