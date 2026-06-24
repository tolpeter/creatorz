"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Handshake,
  Loader2,
  MessageSquare,
  Package,
  PencilLine,
  Plus,
  Send,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatorReviewModal } from "@/components/shared/creator-review-modal";
import { BrandReviewModal } from "@/components/shared/brand-review-modal";
import {
  acceptAgreement,
  addDeliverable,
  markCompleted,
  proposeAgreement,
  removeDeliverable,
  requestChanges,
  sendCollabMessage,
  submitDelivery,
  type CollabDeliverable,
  type CollabDetail,
} from "@/app/actions/collaborations";

const fmtDate = (d: Date | string | null) =>
  d ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d)) : null;
const fmtDateTime = (d: Date | string | null) =>
  d
    ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "short", timeStyle: "short" }).format(new Date(d))
    : null;

function providerOf(url: string): string {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    if (h.includes("drive.google") || h.includes("docs.google")) return "Google Drive";
    if (h.includes("dropbox")) return "Dropbox";
    if (h.includes("wetransfer")) return "WeTransfer";
    if (h.includes("youtube") || h.includes("youtu.be")) return "YouTube";
    if (h.includes("tiktok")) return "TikTok";
    if (h.includes("instagram")) return "Instagram";
    if (h.includes("vimeo")) return "Vimeo";
    if (h.includes("frame.io")) return "Frame.io";
    if (h.includes("icloud")) return "iCloud";
    return h;
  } catch {
    return "Link";
  }
}

type ActionRes = { error?: string; success?: boolean };

export function CollaborationWorkspace({ c }: { c: CollabDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const isCreator = c.viewerRole === "creator";
  const isBrand = c.viewerRole === "brand";

  const completed = !!c.completedAt || c.status === "closed" || c.status === "reviewed";
  const delivered = !!c.deliveredAt || completed;
  const agreed = !!c.agreedAt;
  const proposed = !!c.agreementNote;
  const round = c.currentRound || 1;
  const roundDeliverables = c.deliverables.filter((d) => d.round === round);
  const hasWork = c.deliverables.length > 0 || delivered;

  const lastEvent = c.events[c.events.length - 1];
  const changesPending = agreed && !delivered && !completed && lastEvent?.kind === "changes_requested";
  const messagesHref = isCreator ? "/creator/messages" : "/brand/messages";

  function run(fn: () => Promise<ActionRes>, ok: string, after?: () => void) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(ok);
        after?.();
        router.refresh();
      }
    });
  }

  // ── Fázisok (idővonal) ────────────────────────────────────────────────────
  const steps = [
    { label: "Indítás", date: fmtDate(c.acceptedAt), done: true },
    { label: "Megállapodás", date: fmtDate(c.agreedAt), done: agreed },
    { label: "Munka", date: null, done: hasWork || agreed },
    { label: "Leadva", date: fmtDate(c.deliveredAt), done: delivered },
    { label: "Lezárva", date: fmtDate(c.completedAt), done: completed },
  ];

  // ── "Te jössz" — a néző következő teendője ─────────────────────────────────
  let cta: { text: string; tone: "you" | "wait" | "done" } = { text: "", tone: "wait" };
  if (completed) {
    cta = { text: "Az együttműködés lezárult. 🎉", tone: "done" };
  } else if (!agreed) {
    if (isBrand)
      cta = proposed
        ? { text: "Megállapodás elküldve — várj a tartalomgyártó elfogadására.", tone: "wait" }
        : { text: "Te jössz: javasolj megállapodást (mit vársz, határidő).", tone: "you" };
    else
      cta = proposed
        ? { text: "Te jössz: nézd át és fogadd el a megállapodást.", tone: "you" }
        : { text: "Várj a márka megállapodási javaslatára.", tone: "wait" };
  } else if (!delivered) {
    if (isCreator)
      cta = {
        text: changesPending
          ? "Te jössz: töltsd fel a javított anyagot és add le újra."
          : "Te jössz: töltsd fel a kész anyag linkjét, és add le.",
        tone: "you",
      };
    else
      cta = {
        text: changesPending
          ? "Változtatást kértél — várakozás az új leadásra."
          : "Várakozás a tartalomgyártó leadására.",
        tone: "wait",
      };
  } else {
    // delivered, !completed
    if (isBrand) cta = { text: "Te jössz: nézd át a leadott anyagot, hagyd jóvá vagy kérj változtatást.", tone: "you" };
    else cta = { text: "Leadva — várakozás a márka jóváhagyására.", tone: "wait" };
  }

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
        ) : agreed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <Sparkles className="h-3.5 w-3.5" /> Munka folyamatban
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            <Handshake className="h-3.5 w-3.5" /> Megállapodás
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
                <span className="mt-1.5 text-[11px] font-semibold sm:text-xs">{s.label}</span>
                <span className="text-[10px] text-muted-foreground sm:text-[11px]">{s.date ?? "—"}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn("mx-1 h-0.5 flex-1 rounded", steps[i + 1].done ? "bg-accent" : "bg-muted")}
                />
              )}
            </div>
          ))}
        </div>

        {/* "Te jössz" sáv */}
        <div
          className={cn(
            "mt-5 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold",
            cta.tone === "you"
              ? "border-accent/50 bg-accent/10 text-[#3f6212]"
              : cta.tone === "done"
                ? "border-[#cfe0a8] bg-[#f0f4e5] text-[#3f6212]"
                : "border-muted bg-muted/40 text-muted-foreground",
          )}
        >
          {cta.tone === "you" ? (
            <ArrowRight className="h-4 w-4 shrink-0" />
          ) : cta.tone === "done" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 shrink-0" />
          )}
          {cta.text}
        </div>
      </div>

      {/* 1) Megállapodás */}
      <AgreementCard
        c={c}
        agreed={agreed}
        proposed={proposed}
        completed={completed}
        isBrand={isBrand}
        isCreator={isCreator}
        pending={pending}
        run={run}
      />

      {/* 2) Kész anyag (linkek) — csak megállapodás után */}
      {agreed && (
        <DeliverablesCard
          c={c}
          round={round}
          roundDeliverables={roundDeliverables}
          completed={completed}
          delivered={delivered}
          changesPending={changesPending}
          isBrand={isBrand}
          isCreator={isCreator}
          pending={pending}
          run={run}
        />
      )}

      {/* 3) Lezárás / értékelés */}
      {(delivered || completed) && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="h-4 w-4 text-[#4d7c0f]" /> Lezárás és értékelés
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {!completed && isBrand && (
              <Button
                size="sm"
                className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
                disabled={pending}
                onClick={() => run(() => markCompleted(c.id), "Jóváhagyva és lezárva")}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Jóváhagyás és lezárás
              </Button>
            )}
            {!completed && isCreator && (
              <span className="text-sm text-muted-foreground">
                A jóváhagyás és lezárás a márka feladata.
              </span>
            )}

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
        </div>
      )}

      {/* 4) Beszélgetés (folyamatos kapcsolattartás) */}
      <ChatCard c={c} messagesHref={messagesHref} pending={pending} run={run} />
    </div>
  );
}

// ─────────────────────────── Megállapodás ──────────────────────────────────
function AgreementCard({
  c,
  agreed,
  proposed,
  completed,
  isBrand,
  isCreator,
  pending,
  run,
}: {
  c: CollabDetail;
  agreed: boolean;
  proposed: boolean;
  completed: boolean;
  isBrand: boolean;
  isCreator: boolean;
  pending: boolean;
  run: (fn: () => Promise<ActionRes>, ok: string, after?: () => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(c.agreementNote ?? "");
  const [deadline, setDeadline] = useState("");

  const showProposeForm = isBrand && !agreed && (!proposed || editing);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Handshake className="h-4 w-4 text-[#4d7c0f]" /> Megállapodás
      </h3>

      {/* Elfogadott / javasolt feltételek megjelenítése */}
      {c.agreementNote && !showProposeForm && (
        <div
          className={cn(
            "space-y-2 rounded-xl border p-3.5",
            agreed ? "border-[#cfe0a8] bg-[#f7faef]" : "border-amber-200 bg-amber-50",
          )}
        >
          <p className="whitespace-pre-wrap text-sm">{c.agreementNote}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {c.agreedDeadline && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> Határidő: {fmtDate(c.agreedDeadline)}
              </span>
            )}
            {agreed ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#4d7c0f]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Elfogadva: {fmtDateTime(c.agreedAt)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                <Loader2 className="h-3.5 w-3.5" /> Elfogadásra vár
              </span>
            )}
          </div>

          {/* Creator: elfogadás */}
          {isCreator && !agreed && (
            <div className="pt-1">
              <Button
                size="sm"
                className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
                disabled={pending}
                onClick={() => run(() => acceptAgreement(c.id), "Megállapodás elfogadva")}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Elfogadom a megállapodást
              </Button>
            </div>
          )}

          {/* Brand: javaslat szerkesztése, amíg nincs elfogadva */}
          {isBrand && !agreed && (
            <div className="pt-1">
              <Button size="sm" variant="outline" disabled={pending} onClick={() => setEditing(true)}>
                <PencilLine className="h-4 w-4" /> Javaslat módosítása
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Brand: javaslat űrlap */}
      {showProposeForm && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Mit vársz a tartalomgyártótól? (leszállítandó anyagok, elvárások)
            </label>
            <Textarea
              value={note}
              rows={4}
              maxLength={2000}
              placeholder="Pl. 1 db 30-60 mp-es 9:16 reel a termékről, 3 db story, organikus stílus…"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Határidő (opcionális)
            </label>
            <Input
              type="date"
              value={deadline}
              className="w-fit"
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            {proposed && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setEditing(false)}>
                Mégse
              </Button>
            )}
            <Button
              size="sm"
              className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
              disabled={pending}
              onClick={() =>
                run(
                  () => proposeAgreement(c.id, { note, deadline: deadline || null }),
                  "Megállapodási javaslat elküldve",
                  () => setEditing(false),
                )
              }
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {proposed ? "Javaslat frissítése" : "Javaslat küldése"}
            </Button>
          </div>
        </div>
      )}

      {/* Creator, még nincs javaslat */}
      {isCreator && !proposed && (
        <p className="rounded-xl border border-dashed bg-muted/30 p-3.5 text-sm text-muted-foreground">
          A márka még nem küldött megállapodási javaslatot. Amint megérkezik, itt tudod elfogadni.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────── Kész anyag (linkek) ───────────────────────────
function DeliverablesCard({
  c,
  round,
  roundDeliverables,
  completed,
  delivered,
  changesPending,
  isBrand,
  isCreator,
  pending,
  run,
}: {
  c: CollabDetail;
  round: number;
  roundDeliverables: CollabDeliverable[];
  completed: boolean;
  delivered: boolean;
  changesPending: boolean;
  isBrand: boolean;
  isCreator: boolean;
  pending: boolean;
  run: (fn: () => Promise<ActionRes>, ok: string, after?: () => void) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [showChange, setShowChange] = useState(false);
  const [changeNote, setChangeNote] = useState("");

  // Csoportosítás körök szerint
  const rounds = Array.from(new Set(c.deliverables.map((d) => d.round))).sort((a, b) => a - b);
  const multiRound = rounds.length > 1;

  const canEdit = isCreator && !completed;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <FileText className="h-4 w-4 text-[#4d7c0f]" /> Kész anyag átadása
        </h3>
        {canEdit && !delivered && !showAdd && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Link hozzáadása
          </Button>
        )}
      </div>

      {/* Link hozzáadás űrlap */}
      {canEdit && showAdd && (
        <div className="mb-4 space-y-2 rounded-xl border border-accent/40 bg-accent/5 p-3.5">
          <Input
            value={url}
            placeholder="https://drive.google.com/... (Google Drive, Dropbox, WeTransfer…)"
            onChange={(e) => setUrl(e.target.value)}
          />
          <Input
            value={title}
            maxLength={200}
            placeholder="Megnevezés (opcionális) — pl. „Reel v1 — 9:16"
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setShowAdd(false);
                setUrl("");
                setTitle("");
              }}
            >
              Mégse
            </Button>
            <Button
              size="sm"
              className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
              disabled={pending || !url.trim()}
              onClick={() =>
                run(() => addDeliverable(c.id, { url, title }), "Link hozzáadva", () => {
                  setUrl("");
                  setTitle("");
                  setShowAdd(false);
                })
              }
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Hozzáadás
            </Button>
          </div>
        </div>
      )}

      {/* Linkek listája körök szerint */}
      {c.deliverables.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/30 p-3.5 text-sm text-muted-foreground">
          {isCreator
            ? "Még nincs feltöltött link. Add hozzá a kész anyag megosztási linkjét (Google Drive, Dropbox, WeTransfer…), majd add le."
            : "A tartalomgyártó még nem töltött fel kész anyagot."}
        </p>
      ) : (
        <div className="space-y-4">
          {rounds.map((r) => {
            const items = c.deliverables.filter((d) => d.round === r);
            return (
              <div key={r}>
                {multiRound && (
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                    {r}. kör{r > 1 ? " (javítás)" : ""}
                  </p>
                )}
                <ul className="space-y-2">
                  {items.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 rounded-xl border bg-background p-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-[11px] font-bold text-[#3f6212]">
                        {providerOf(d.url).slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{d.title || providerOf(d.url)}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.url}</p>
                      </div>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-[#4d7c0f] transition-colors hover:border-accent hover:bg-accent/10"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Megnyitás
                      </a>
                      {canEdit && !delivered && d.round === round && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => removeDeliverable(d.id), "Link törölve")}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Törlés"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Akciók: leadás / jóváhagyás / változtatás */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        {isCreator && !completed && !delivered && (
          <Button
            size="sm"
            className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
            disabled={pending || roundDeliverables.length === 0}
            onClick={() => run(() => submitDelivery(c.id), "Munka leadva")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            {changesPending ? "Javított anyag leadása" : "Leadás jóváhagyásra"}
          </Button>
        )}
        {isCreator && !completed && delivered && (
          <span className="text-sm text-muted-foreground">Leadva — várakozás a márka jóváhagyására.</span>
        )}

        {isBrand && !completed && delivered && !showChange && (
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
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setShowChange(true)}>
              <PencilLine className="h-4 w-4" /> Változtatást kérek
            </Button>
          </>
        )}
        {isBrand && !completed && !delivered && (
          <span className="text-sm text-muted-foreground">
            {changesPending
              ? "Változtatást kértél — várakozás az új leadásra."
              : "Várakozás a tartalomgyártó leadására."}
          </span>
        )}
      </div>

      {/* Változtatás-kérés doboz */}
      {showChange && isBrand && !completed && (
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
                run(() => requestChanges(c.id, changeNote), "Változtatás kérve", () => {
                  setShowChange(false);
                  setChangeNote("");
                })
              }
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
              Változtatás kérése
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Beszélgetés ───────────────────────────────────
function ChatCard({
  c,
  messagesHref,
  pending,
  run,
}: {
  c: CollabDetail;
  messagesHref: string;
  pending: boolean;
  run: (fn: () => Promise<ActionRes>, ok: string, after?: () => void) => void;
}) {
  const [text, setText] = useState("");
  const recent = c.messages.slice(-6);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare className="h-4 w-4 text-[#4d7c0f]" /> Beszélgetés
        </h3>
        <Link href={messagesHref} className="text-xs font-semibold text-[#4d7c0f] hover:underline">
          Teljes beszélgetés →
        </Link>
      </div>

      {recent.length > 0 ? (
        <div className="mb-3 space-y-2">
          {recent.map((m) => {
            const mine = m.fromUserId === c.myUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    mine ? "bg-accent text-black" : "bg-muted text-foreground",
                  )}
                >
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  {m.attachmentUrl && (
                    <a
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold underline"
                    >
                      <ExternalLink className="h-3 w-3" /> {m.attachmentName ?? "Csatolmány"}
                    </a>
                  )}
                  <span
                    className={cn(
                      "mt-0.5 block text-[10px]",
                      mine ? "text-black/60" : "text-muted-foreground",
                    )}
                  >
                    {fmtDateTime(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mb-3 rounded-xl border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
          Még nincs üzenet. Írj a partnerednek a részletek egyeztetéséhez.
        </p>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          rows={2}
          maxLength={4000}
          placeholder="Írj üzenetet…"
          className="resize-none"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) {
              e.preventDefault();
              run(() => sendCollabMessage(c.id, text), "Üzenet elküldve", () => setText(""));
            }
          }}
        />
        <Button
          size="icon"
          className="h-10 w-10 shrink-0 bg-accent text-black hover:bg-black hover:text-accent"
          disabled={pending || !text.trim()}
          onClick={() => run(() => sendCollabMessage(c.id, text), "Üzenet elküldve", () => setText(""))}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Az üzenetek az „Üzenetek" menüben is megjelennek, az idővonal eseményeivel együtt.
      </p>
    </div>
  );
}
