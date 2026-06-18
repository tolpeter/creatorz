import Link from "next/link";
import { Eye, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatHuDate } from "@/lib/utils/format";
import type { ViewerIdentity } from "@/lib/viewers";

export type ViewerRow = {
  identity: ViewerIdentity;
  lastAt: Date;
  times: number;
};

/**
 * "Kik nézték meg" lista — csak azoknak jelenik meg, akiknél az admin
 * bekapcsolta a funkciót. Az anonim (be nem jelentkezett) látogatók nem
 * azonosíthatók, őket csak a számláló tartalmazza.
 */
export function ViewersPanel({
  viewers,
  anonymousCount = 0,
  emptyLabel = "Még senki azonosítható nem nézte meg.",
}: {
  viewers: ViewerRow[];
  anonymousCount?: number;
  emptyLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-accent/30 bg-[#f6f7f2] p-4">
      <p className="flex items-center gap-2 text-sm font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-[#3f6212]">
          <Eye className="h-4 w-4" />
        </span>
        Kik nézték meg
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3f6212]">
          <Sparkles className="h-3 w-3" /> Kiemelt
        </span>
      </p>

      {viewers.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {viewers.map((v) => {
            const inner = (
              <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm transition-colors hover:bg-accent/5">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={v.identity.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {v.identity.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{v.identity.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.identity.type === "brand"
                      ? "Márka"
                      : v.identity.type === "creator"
                        ? "Tartalomgyártó"
                        : "Felhasználó"}
                    {" · "}
                    {formatHuDate(v.lastAt)}
                    {v.times > 1 ? ` · ${v.times}×` : ""}
                  </p>
                </div>
              </div>
            );
            return v.identity.username ? (
              <Link
                key={v.identity.userId}
                href={`/creators/${v.identity.username}`}
                target="_blank"
                className="block"
              >
                {inner}
              </Link>
            ) : (
              <div key={v.identity.userId}>{inner}</div>
            );
          })}
        </div>
      )}

      {anonymousCount > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          + {anonymousCount} be nem jelentkezett látogató (nem azonosítható).
        </p>
      )}
    </div>
  );
}
