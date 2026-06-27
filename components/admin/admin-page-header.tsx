import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Egységes admin oldal-fejléc: ikon-chip + cím + leírás + opcionális akció.
 * Minden admin aloldal ezt használja a konzisztens, letisztult fejlécért.
 */
export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-[#3f6212]">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
