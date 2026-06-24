import { Package, PencilLine, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "@/components/shared/message-attachment";
import { formatHuf } from "@/lib/utils/format";

export type ThreadItem =
  | {
      type: "msg";
      id: string;
      at: number;
      fromUserId: string;
      subject?: string | null;
      body: string;
      attachmentUrl: string | null;
      attachmentName: string | null;
      budgetHint?: number | null;
    }
  | { type: "event"; id: string; at: number; kind: string; note: string | null };

const fmtDateTime = (at: number) =>
  new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(at));

/**
 * Beszélgetés-szál: üzenet-buborékok + az együttműködés idővonal-eseményei
 * (leadás / módosítás-kérés / jóváhagyás) IDŐRENDBEN, kis "box"-ként.
 */
export function MessageThread({ items, myId }: { items: ThreadItem[]; myId: string }) {
  return (
    <div className="space-y-2">
      {items.map((it) =>
        it.type === "event" ? (
          <EventBox key={it.id} kind={it.kind} note={it.note} at={it.at} />
        ) : (
          <Bubble key={it.id} mine={it.fromUserId === myId} item={it} />
        ),
      )}
    </div>
  );
}

function Bubble({
  mine,
  item,
}: {
  mine: boolean;
  item: Extract<ThreadItem, { type: "msg" }>;
}) {
  return (
    <div className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          mine ? "rounded-br-sm bg-accent text-accent-foreground" : "rounded-bl-sm bg-white",
        )}
      >
        {item.subject && (
          <p className="mb-1 text-xs font-semibold opacity-80">{item.subject}</p>
        )}
        {item.body && <p className="whitespace-pre-wrap break-words">{item.body}</p>}
        {item.attachmentUrl && (
          <MessageAttachment url={item.attachmentUrl} name={item.attachmentName} mine={mine} />
        )}
        {item.budgetHint != null && (
          <p className="mt-1 text-xs opacity-80">Becsült bérezés: {formatHuf(item.budgetHint)}</p>
        )}
      </div>
      <span className="px-1 text-[11px] text-muted-foreground">{fmtDateTime(item.at)}</span>
    </div>
  );
}

function EventBox({ kind, note, at }: { kind: string; note: string | null; at: number }) {
  const cfg =
    kind === "approved"
      ? { icon: <CheckCircle2 className="h-4 w-4" />, label: "Jóváhagyva — az együttműködés lezárult", cls: "border-accent/40 bg-[#f0f4e5] text-[#3f6212]" }
      : kind === "changes_requested"
        ? { icon: <PencilLine className="h-4 w-4" />, label: "Változtatás kérve", cls: "border-amber-300 bg-amber-50 text-amber-800" }
        : { icon: <Package className="h-4 w-4" />, label: "Anyag leadva", cls: "border-accent/40 bg-accent/10 text-[#3f6212]" };

  return (
    <div className="flex justify-center py-1">
      <div className={cn("max-w-[90%] rounded-xl border px-3 py-2 text-center text-xs font-medium", cfg.cls)}>
        <span className="inline-flex items-center gap-1.5 font-bold">
          {cfg.icon}
          {cfg.label}
        </span>
        {note && <p className="mt-1 whitespace-pre-wrap break-words font-normal">„{note}"</p>}
        <p className="mt-0.5 opacity-70">{fmtDateTime(at)}</p>
      </div>
    </div>
  );
}
