"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Paperclip,
  PencilLine,
  Send,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageAttachment } from "@/components/shared/message-attachment";
import { CreatorReviewModal } from "@/components/shared/creator-review-modal";
import { BrandReviewModal } from "@/components/shared/brand-review-modal";
import { uploadFile } from "@/lib/supabase/upload";
import {
  markDelivered,
  markCompleted,
  requestChanges,
  sendCollabMessage,
  type CollabDetail,
} from "@/app/actions/collaborations";

const MAX_MB = 25;

const fmtDate = (d: Date | string | null) =>
  d ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d)) : null;
const fmtDateTime = (d: Date | string | number) =>
  new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

type TimelineRow =
  | { type: "msg"; id: string; at: number; fromUserId: string; body: string; attachmentUrl: string | null; attachmentName: string | null }
  | { type: "event"; id: string; at: number; kind: string; note: string | null };

export function CollaborationWorkspace({ c }: { c: CollabDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const completed =
    !!c.completedAt || c.status === "closed" || c.status === "reviewed";
  const delivered = !!c.deliveredAt || completed;
  const isCreator = c.viewerRole === "creator";
  const isBrand = c.viewerRole === "brand";
  const lastEvent = c.events[c.events.length - 1];
  const changesPending =
    !delivered && !completed && lastEvent?.kind === "changes_requested";

  const steps = [
    { label: "Elfogadva", date: fmtDate(c.acceptedAt), done: true },
    { label: "Leadva", date: fmtDate(c.deliveredAt), done: delivered },
    { label: "Lezárva", date: fmtDate(c.completedAt), done: completed },
  ];

  function run(fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });
  }

  // ── chat ─────────────────────────────────────────────────────────────
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows: TimelineRow[] = [
    ...c.messages.map((m) => ({
      type: "msg" as const,
      id: `m-${m.id}`,
      at: new Date(m.createdAt).getTime(),
      fromUserId: m.fromUserId,
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
    })),
    ...c.events.map((e) => ({
      type: "event" as const,
      id: `e-${e.id}`,
      at: new Date(e.createdAt).getTime(),
      kind: e.kind,
      note: e.note,
    })),
  ].sort((a, b) => a.at - b.at);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [c.messages.length, c.events.length]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`A fájl túl nagy (max ${MAX_MB} MB).`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    const res = await uploadFile("messages", file);
    setUploading(false);
    e.target.value = "";
    if (res.error || !res.url) {
      toast.error(res.error ?? "Feltöltés sikertelen");
      return;
    }
    setAttachment({ url: res.url, name: file.name });
  }

  async function send() {
    if (!body.trim() && !attachment) {
      toast.error("Írj üzenetet vagy csatolj képet.");
      return;
    }
    setSending(true);
    const res = await sendCollabMessage(c.id, {
      body,
      attachmentUrl: attachment?.url ?? null,
      attachmentName: attachment?.name ?? null,
    });
    setSending(false);
    if (res.error) return toast.error(res.error);
    setBody("");
    setAttachment(null);
    router.refresh();
  }

  // ── változtatás-kérés inline doboz ───────────────────────────────────
  const [showChange, setShowChange] = useState(false);
  const [changeNote, setChangeNote] = useState("");

  return (
    <div className="space-y-5">
      {/* Fejléc */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={c.partnerAvatar ?? undefined} />
            <AvatarFallback>{c.partnerName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{c.partnerName}</p>
            <p className="truncate text-sm text-muted-foreground">{c.adTitle}</p>
          </div>
        </div>
        {completed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f0f4e5] px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Lezárva
          </span>
        ) : changesPending ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
            <PencilLine className="h-3.5 w-3.5" /> Változtatás kérve
          </span>
        ) : delivered ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <Package className="h-3.5 w-3.5" /> Jóváhagyásra vár
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <Clock className="h-3.5 w-3.5" /> Folyamatban
          </span>
        )}
      </div>

      {/* Idővonal */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2",
                    s.done
                      ? "border-accent bg-accent text-black"
                      : "border-muted bg-background text-muted-foreground",
                  )}
                >
                  {s.done ? <Check className="h-5 w-5" /> : <span className="text-xs">{i + 1}</span>}
                </span>
                <span className="mt-1.5 text-xs font-semibold">{s.label}</span>
                <span className="text-[11px] text-muted-foreground">{s.date ?? "—"}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 rounded",
                    steps[i + 1].done ? "bg-accent" : "bg-muted",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Akciók */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
          {/* Creator: leadás */}
          {!completed && isCreator && !delivered && (
            <Button
              size="sm"
              className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
              disabled={pending}
              onClick={() => run(() => markDelivered(c.id), "Munka leadva")}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              {changesPending ? "Javított anyag leadása" : "Munka leadása"}
            </Button>
          )}
          {!completed && isCreator && delivered && (
            <span className="text-sm text-muted-foreground">
              Leadva — várakozás a márka jóváhagyására.
            </span>
          )}

          {/* Brand: jóváhagyás / változtatás */}
          {!completed && isBrand && delivered && !showChange && (
            <>
              <Button
                size="sm"
                className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
                disabled={pending}
                onClick={() => run(() => markCompleted(c.id), "Jóváhagyva és lezárva")}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Jóváhagyás
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setShowChange(true)}
              >
                <PencilLine className="h-4 w-4" /> Változtatást kérek
              </Button>
            </>
          )}
          {!completed && isBrand && !delivered && (
            <span className="text-sm text-muted-foreground">
              {changesPending
                ? "Változtatást kértél — várakozás az új leadásra."
                : "Várakozás a tartalomgyártó leadására."}
            </span>
          )}

          {/* Lezárva → értékelés */}
          {completed && isBrand && !c.creatorReviewedByBrand && (
            <CreatorReviewModal collabId={c.id} creatorName={c.partnerName} />
          )}
          {completed && isBrand && c.creatorReviewedByBrand && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#4d7c0f]">
              <Star className="h-4 w-4 fill-current" /> Értékelted a tartalomgyártót
            </span>
          )}
          {completed && isCreator && !c.brandReviewedByCreator && (
            <BrandReviewModal collabId={c.id} brandName={c.partnerName} />
          )}
          {completed && isCreator && c.brandReviewedByCreator && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#4d7c0f]">
              <Star className="h-4 w-4 fill-current" /> Értékelted a márkát
            </span>
          )}
        </div>

        {/* Változtatás-kérés inline doboz */}
        {showChange && !completed && isBrand && (
          <div className="mt-3 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-800">Mit kérsz másképp?</p>
            <Textarea
              value={changeNote}
              rows={3}
              maxLength={1000}
              placeholder="Írd le röviden, min változtasson a tartalomgyártó…"
              onChange={(e) => setChangeNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowChange(false)} disabled={pending}>
                Mégse
              </Button>
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const res = await requestChanges(c.id, changeNote);
                    if (!res.error) {
                      setShowChange(false);
                      setChangeNote("");
                    }
                    return res;
                  }, "Változtatás kérve")
                }
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                Változtatás kérése
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-bold">Beszélgetés</p>
          <p className="text-xs text-muted-foreground">
            Írjatok egymásnak, csatoljatok képet — az idővonal eseményei is itt jelennek meg.
          </p>
        </div>

        <div ref={scrollRef} className="max-h-[460px] min-h-[220px] space-y-3 overflow-y-auto bg-muted/20 p-4">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Még nincs üzenet. Írj az elsőt! 👋
            </p>
          ) : (
            rows.map((r) =>
              r.type === "event" ? (
                <EventBox key={r.id} kind={r.kind} note={r.note} at={r.at} />
              ) : (
                <Bubble
                  key={r.id}
                  mine={r.fromUserId === c.myUserId}
                  body={r.body}
                  attachmentUrl={r.attachmentUrl}
                  attachmentName={r.attachmentName}
                  at={r.at}
                />
              ),
            )
          )}
        </div>

        {/* Bevitel */}
        <div className="space-y-2 border-t p-3">
          {attachment && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs">
              <Paperclip className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Csatolmány eltávolítása"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || sending}
              aria-label="Kép csatolása"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Textarea
              value={body}
              rows={1}
              maxLength={5000}
              placeholder="Írj üzenetet…"
              className="max-h-32 min-h-[40px] flex-1 resize-none"
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="shrink-0 bg-accent text-black hover:bg-black hover:text-accent"
              onClick={send}
              disabled={sending || uploading}
              aria-label="Küldés"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  mine,
  body,
  attachmentUrl,
  attachmentName,
  at,
}: {
  mine: boolean;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  at: number;
}) {
  return (
    <div className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          mine ? "rounded-br-sm bg-accent text-accent-foreground" : "rounded-bl-sm bg-white",
        )}
      >
        {body && <p className="whitespace-pre-wrap break-words">{body}</p>}
        {attachmentUrl && (
          <MessageAttachment url={attachmentUrl} name={attachmentName} mine={mine} />
        )}
      </div>
      <span className="px-1 text-[11px] text-muted-foreground">{fmtDateTime(at)}</span>
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
    <div className="flex justify-center">
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
