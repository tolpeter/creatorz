import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Moderálásra vár", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
  active: { label: "Aktív", cls: "bg-green-500/15 text-green-700 dark:text-green-400" },
  closed: { label: "Lezárva", cls: "bg-muted text-muted-foreground" },
  rejected: { label: "Elutasítva", cls: "bg-destructive/15 text-destructive" },
};

const APP_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Függőben", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
  accepted: { label: "Elfogadva", cls: "bg-green-500/15 text-green-700 dark:text-green-400" },
  rejected: { label: "Elutasítva", cls: "bg-destructive/15 text-destructive" },
  withdrawn: { label: "Visszavonva", cls: "bg-muted text-muted-foreground" },
};

export function AdStatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

export function ApplicationStatusBadge({ status }: { status: string }) {
  const s = APP_MAP[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>
      {s.label}
    </span>
  );
}
