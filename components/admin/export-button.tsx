import { Download } from "lucide-react";

/** Admin CSV-export letöltő gomb (egyszerű letöltő link az export route-ra). */
export function ExportButton({
  type,
  label = "CSV export",
}: {
  type:
    | "users"
    | "creators"
    | "creators-ugc"
    | "creators-influencer"
    | "creators-model"
    | "creators-pro"
    | "brands"
    | "ads"
    | "reviews"
    | "newsletter";
  label?: string;
}) {
  return (
    <a
      href={`/api/admin/export?type=${type}`}
      className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
    >
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}
