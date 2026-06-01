import Link from "next/link";
import { CalendarDays, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CREATOR_CATEGORIES, CONTENT_TYPES } from "@/lib/constants";
import { formatHuf, formatHuDate } from "@/lib/utils/format";

export type AdCardData = {
  id: string;
  title: string;
  brandName: string;
  brandLogo: string | null;
  categories: string[];
  contentType: string;
  budgetMinHuf: number;
  budgetMaxHuf: number;
  deadline: Date;
};

export function AdCard({ ad }: { ad: AdCardData }) {
  return (
    <Link
      href={`/ads/${ad.id}`}
      className="block rounded-xl border bg-card p-4 transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        {ad.brandLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.brandLogo} alt="" className="h-8 w-8 rounded object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-semibold">
            {ad.brandName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-muted-foreground">{ad.brandName}</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold">{ad.title}</h3>

      <div className="mt-2 flex flex-wrap gap-1">
        {ad.categories.map((c) => (
          <Badge key={c} variant="secondary" className="text-xs">
            {CREATOR_CATEGORIES.find((x) => x.value === c)?.label ?? c}
          </Badge>
        ))}
        <Badge variant="outline" className="text-xs">
          {CONTENT_TYPES.find((x) => x.value === ad.contentType)?.label ?? ad.contentType}
        </Badge>
      </div>

      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <Wallet className="h-4 w-4" />
          {formatHuf(ad.budgetMinHuf)} – {formatHuf(ad.budgetMaxHuf)}
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" /> Határidő: {formatHuDate(ad.deadline)}
        </p>
      </div>

      <div className="mt-4 text-sm font-semibold text-accent">Részletek és pályázás →</div>
    </Link>
  );
}
