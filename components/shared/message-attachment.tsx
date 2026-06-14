import { Paperclip, Download } from "lucide-react";

function isImage(url: string) {
  return /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
}

/** Üzenet-csatolmány: képnél előnézet, egyébként letölthető fájl-chip. */
export function MessageAttachment({
  url,
  name,
  mine,
}: {
  url: string;
  name: string | null;
  mine?: boolean;
}) {
  if (isImage(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name ?? "csatolmány"}
          className="max-h-56 w-auto max-w-full rounded-lg border border-black/10 object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors " +
        (mine
          ? "border-black/20 bg-black/5 hover:bg-black/10"
          : "border-black/10 bg-white hover:bg-muted")
      }
    >
      <Paperclip className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{name ?? "Csatolmány"}</span>
      <Download className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
}
