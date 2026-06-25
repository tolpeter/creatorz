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
import {
  acceptProjectAgreement,
  addProjectDeliverable,
  approveProjectWork,
  proposeProjectAgreement,
  removeProjectDeliverable,
  requestProjectChanges,
  sendProjectMessage,
  submitProjectDelivery,
  submitProjectReview,
  type ProjectDeliverable,
  type ProjectDetail,
} from "@/app/actions/creator-projects";

const fmtDate = (d: Date | string | null) =>
  d ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d)) : null;
const fmtDateTime = (d: Date | string | null) =>
  d ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "short", timeStyle: "short" }).format(new Date(d)) : null;

function providerOf(url: string): string {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    if (h.includes("drive.google") || h.includes("docs.google")) return "Google Drive";
    if (h.includes("dropbox")) return "Dropbox";
    if (h.includes("wetransfer")) return "WeTransfer";
    if (h.includes("youtube") || h.includes("youtu.be")) return "YouTube";
    if (h.includes("vimeo")) return "Vimeo";
    return h;
  } catch {
    return "Link";
  }
}

type ActionRes = { error?: string; success?: boolean };

export function CreatorProjectWorkspace({ p }: { p: ProjectDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const isRequester = p.viewerRole === "requester"; // ≈ márka szerep
  const isPartner = p.viewerRole === "partner"; // ≈ alkotó szerep

  const closed = !!p.completedAt || p.status === "closed";
  const approved = closed || !!p.approvedAt || p.status === "review_pending";
  const delivered = !!p.deliveredAt || approved;
  const agreed = !!p.agreedAt;
  const proposed = !!p.agreementNote;
  const round = p.currentRound || 1;
  const roundDeliverables = p.deliverables.filter((d) => d.round === round);

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

  const steps = [
    { label: "Indítás", date: null, done: true },
    { label: "Megállapodás", date: fmtDate(p.agreedAt), done: agreed },
    { label: "Leadva", date: fmtDate(p.deliveredAt), done: delivered },
    { label: "Jóváhagyva", date: fmtDate(p.approvedAt), done: approved },
    { label: "Lezárva", date: fmtDate(p.completedAt), done: closed },
  ];

  let cta: { text: string; tone: "you" | "wait" | "done" } = { text: "", tone: "wait" };
  if (closed) cta = { text: "A közös projekt lezárult. 🎉", tone: "done" };
  else if (approved) {
    if (!p.myReviewDone)
      cta = { text: "Te jössz: írj véleményt a közös munkáról — KÖTELEZŐ a lezáráshoz.", tone: "you" };
    else cta = { text: "Megírtad az értékelést — várakozás a partner értékelésére a lezáráshoz.", tone: "wait" };
  } else if (!agreed) {
    if (isRequester)
      cta = proposed
        ? { text: "Megállapodás elküldve — várj a partner elfogadására.", tone: "wait" }
        : { text: "Te jössz: javasolj megállapodást (mit vársz, határidő).", tone: "you" };
    else
      cta = proposed
        ? { text: "Te jössz: nézd át és fogadd el a megállapodást.", tone: "you" }
        : { text: "Várj a felkérő megállapodási javaslatára.", tone: "wait" };
  } else if (!delivered) {
    if (isPartner) cta = { text: "Te jössz: töltsd fel a kész anyag linkjét, és add le.", tone: "you" };
    else cta = { text: "Várakozás a partner leadására.", tone: "wait" };
  } else {
    if (isRequester) cta = { text: "Te jössz: nézd át a leadott anyagot, hagyd jóvá vagy kérj változtatást.", tone: "you" };
    else cta = { text: "Leadva — várakozás a felkérő jóváhagyására.", tone: "wait" };
  }

  return (
    <div className="space-y-5">
      {/* Fejléc */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={p.otherAvatar ?? undefined} />
            <AvatarFallback>{p.otherName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{p.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {isRequester ? "Partnered: " : "Felkért: "}
              {p.otherName}
            </p>
          </div>
        </div>
        {closed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f0f4e5] px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Lezárva
          </span>
        ) : approved ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
            <Star className="h-3.5 w-3.5" /> Értékelésre vár
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
                    s.done ? "border-accent bg-accent text-black" : "border-muted bg-background text-muted-foreground",
                  )}
                >
                  {s.done ? <Check className="h-5 w-5" /> : <span className="text-xs">{i + 1}</span>}
                </span>
                <span className="mt-1.5 text-[11px] font-semibold sm:text-xs">{s.label}</span>
                <span className="text-[10px] text-muted-foreground sm:text-[11px]">{s.date ?? "—"}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("mx-1 h-0.5 flex-1 rounded", steps[i + 1].done ? "bg-accent" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

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
          {cta.tone === "you" ? <ArrowRight className="h-4 w-4 shrink-0" /> : cta.tone === "done" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Loader2 className="h-4 w-4 shrink-0" />}
          {cta.text}
        </div>
      </div>

      {/* 1) Megállapodás */}
      <AgreementCard p={p} agreed={agreed} proposed={proposed} isRequester={isRequester} isPartner={isPartner} pending={pending} run={run} />

      {/* 2) Kész anyag */}
      {agreed && (
        <DeliverablesCard
          p={p}
          round={round}
          roundDeliverables={roundDeliverables}
          approved={approved}
          delivered={delivered}
          isRequester={isRequester}
          isPartner={isPartner}
          pending={pending}
          run={run}
        />
      )}

      {/* 3) Értékelés és lezárás */}
      {approved && <ReviewGateCard p={p} closed={closed} pending={pending} run={run} />}

      {/* 4) Beszélgetés */}
      <ChatCard p={p} pending={pending} run={run} />
    </div>
  );
}

function AgreementCard({
  p,
  agreed,
  proposed,
  isRequester,
  isPartner,
  pending,
  run,
}: {
  p: ProjectDetail;
  agreed: boolean;
  proposed: boolean;
  isRequester: boolean;
  isPartner: boolean;
  pending: boolean;
  run: (fn: () => Promise<ActionRes>, ok: string, after?: () => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(p.agreementNote ?? "");
  const [deadline, setDeadline] = useState("");
  const showForm = isRequester && !agreed && (!proposed || editing);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Handshake className="h-4 w-4 text-[#4d7c0f]" /> Megállapodás
      </h3>

      {p.agreementNote && !showForm && (
        <div className={cn("space-y-2 rounded-xl border p-3.5", agreed ? "border-[#cfe0a8] bg-[#f7faef]" : "border-amber-200 bg-amber-50")}>
          <p className="whitespace-pre-wrap text-sm">{p.agreementNote}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {p.agreedDeadline && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> Határidő: {fmtDate(p.agreedDeadline)}
              </span>
            )}
            {agreed ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#4d7c0f]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Elfogadva: {fmtDateTime(p.agreedAt)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                <Loader2 className="h-3.5 w-3.5" /> Elfogadásra vár
              </span>
            )}
          </div>
          {isPartner && !agreed && (
            <div className="pt-1">
              <Button size="sm" className="bg-accent font-bold text-black hover:bg-black hover:text-accent" disabled={pending} onClick={() => run(() => acceptProjectAgreement(p.id), "Megállapodás elfogadva")}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Elfogadom a megállapodást
              </Button>
            </div>
          )}
          {isRequester && !agreed && (
            <div className="pt-1">
              <Button size="sm" variant="outline" disabled={pending} onClick={() => setEditing(true)}>
                <PencilLine className="h-4 w-4" /> Javaslat módosítása
              </Button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Mit vársz a partnertől? (anyagok, elvárások)</label>
            <Textarea value={note} rows={4} maxLength={2000} placeholder="Pl. közös fotózás, 10 retusált kép leadása…" onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Határidő (opcionális)</label>
            <Input type="date" value={deadline} className="w-fit" onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            {proposed && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setEditing(false)}>
                Mégse
              </Button>
            )}
            <Button size="sm" className="bg-accent font-bold text-black hover:bg-black hover:text-accent" disabled={pending} onClick={() => run(() => proposeProjectAgreement(p.id, { note, deadline: deadline || null }), "Megállapodási javaslat elküldve", () => setEditing(false))}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {proposed ? "Javaslat frissítése" : "Javaslat küldése"}
            </Button>
          </div>
        </div>
      )}

      {isPartner && !proposed && (
        <p className="rounded-xl border border-dashed bg-muted/30 p-3.5 text-sm text-muted-foreground">
          A felkérő még nem küldött megállapodási javaslatot. Amint megérkezik, itt tudod elfogadni.
        </p>
      )}
    </div>
  );
}

function DeliverablesCard({
  p,
  round,
  roundDeliverables,
  approved,
  delivered,
  isRequester,
  isPartner,
  pending,
  run,
}: {
  p: ProjectDetail;
  round: number;
  roundDeliverables: ProjectDeliverable[];
  approved: boolean;
  delivered: boolean;
  isRequester: boolean;
  isPartner: boolean;
  pending: boolean;
  run: (fn: () => Promise<ActionRes>, ok: string, after?: () => void) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [showChange, setShowChange] = useState(false);
  const [changeNote, setChangeNote] = useState("");

  const rounds = Array.from(new Set(p.deliverables.map((d) => d.round))).sort((a, b) => a - b);
  const multiRound = rounds.length > 1;
  const canEdit = isPartner && !approved;

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

      {canEdit && showAdd && (
        <div className="mb-4 space-y-2 rounded-xl border border-accent/40 bg-accent/5 p-3.5">
          <Input value={url} placeholder="https://drive.google.com/... (Drive, Dropbox, WeTransfer…)" onChange={(e) => setUrl(e.target.value)} />
          <Input value={title} maxLength={200} placeholder="Megnevezés (opcionális)" onChange={(e) => setTitle(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => { setShowAdd(false); setUrl(""); setTitle(""); }}>
              Mégse
            </Button>
            <Button size="sm" className="bg-accent font-bold text-black hover:bg-black hover:text-accent" disabled={pending || !url.trim()} onClick={() => run(() => addProjectDeliverable(p.id, { url, title }), "Link hozzáadva", () => { setUrl(""); setTitle(""); setShowAdd(false); })}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Hozzáadás
            </Button>
          </div>
        </div>
      )}

      {p.deliverables.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/30 p-3.5 text-sm text-muted-foreground">
          {isPartner ? "Még nincs feltöltött link. Add hozzá a kész anyag megosztási linkjét, majd add le." : "A partner még nem töltött fel kész anyagot."}
        </p>
      ) : (
        <div className="space-y-4">
          {rounds.map((r) => {
            const items = p.deliverables.filter((d) => d.round === r);
            return (
              <div key={r}>
                {multiRound && <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{r}. kör{r > 1 ? " (javítás)" : ""}</p>}
                <ul className="space-y-2">
                  {items.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-[11px] font-bold text-[#3f6212]">
                        {providerOf(d.url).slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{d.title || providerOf(d.url)}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.url}</p>
                      </div>
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-[#4d7c0f] transition-colors hover:border-accent hover:bg-accent/10">
                        <ExternalLink className="h-3.5 w-3.5" /> Megnyitás
                      </a>
                      {canEdit && !delivered && d.round === round && (
                        <button type="button" disabled={pending} onClick={() => run(() => removeProjectDeliverable(d.id), "Link törölve")} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Törlés">
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

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        {isPartner && !approved && !delivered && (
          <Button size="sm" className="bg-accent font-bold text-black hover:bg-black hover:text-accent" disabled={pending || roundDeliverables.length === 0} onClick={() => run(() => submitProjectDelivery(p.id), "Munka leadva")}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Leadás jóváhagyásra
          </Button>
        )}
        {isPartner && !approved && delivered && <span className="text-sm text-muted-foreground">Leadva — várakozás a felkérő jóváhagyására.</span>}

        {isRequester && !approved && delivered && !showChange && (
          <>
            <Button size="sm" className="bg-accent font-bold text-black hover:bg-black hover:text-accent" disabled={pending} onClick={() => run(() => approveProjectWork(p.id), "Munka jóváhagyva — most értékeljetek")}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Jóváhagyás
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setShowChange(true)}>
              <PencilLine className="h-4 w-4" /> Változtatást kérek
            </Button>
          </>
        )}
        {isRequester && !approved && !delivered && <span className="text-sm text-muted-foreground">Várakozás a partner leadására.</span>}
        {approved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4d7c0f]">
            <CheckCircle2 className="h-4 w-4" /> A munkát jóváhagyták. A lezáráshoz lásd lent az értékelést.
          </span>
        )}
      </div>

      {showChange && isRequester && !approved && (
        <div className="mt-3 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-800">Mit kérsz másképp?</p>
          <Textarea value={changeNote} rows={3} maxLength={1000} placeholder="Írd le röviden, min változtasson…" onChange={(e) => setChangeNote(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowChange(false)} disabled={pending}>Mégse</Button>
            <Button size="sm" disabled={pending} onClick={() => run(() => requestProjectChanges(p.id, changeNote), "Változtatás kérve", () => { setShowChange(false); setChangeNote(""); })}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
              Változtatás kérése
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewGateCard({
  p,
  closed,
  pending,
  run,
}: {
  p: ProjectDetail;
  closed: boolean;
  pending: boolean;
  run: (fn: () => Promise<ActionRes>, ok: string, after?: () => void) => void;
}) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <Star className="h-4 w-4 text-[#4d7c0f]" /> Értékelés és lezárás
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        A projekt akkor zárul le, ha <strong>mindketten</strong> értékelitek a közös munkát. Az értékelés kötelező.
      </p>

      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <ReviewPill label="A te értékelésed" done={p.myReviewDone} />
        <ReviewPill label="A partner értékelése" done={p.otherReviewDone} />
      </div>

      {!p.myReviewDone ? (
        <div className="space-y-3 rounded-xl border bg-background p-3.5">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} csillag`}>
                <Star className={cn("h-6 w-6", n <= rating ? "fill-accent text-accent" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          <Textarea value={text} rows={3} maxLength={2000} placeholder="Milyen volt a közös munka? (min. 10 karakter)" onChange={(e) => setText(e.target.value)} />
          <div className="flex justify-end">
            <Button size="sm" className="bg-accent font-bold text-black hover:bg-black hover:text-accent" disabled={pending || rating < 1 || text.trim().length < 10} onClick={() => run(() => submitProjectReview(p.id, { overallRating: rating, text }), "Értékelés elküldve")}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              Értékelés küldése
            </Button>
          </div>
        </div>
      ) : closed ? (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-[#4d7c0f]">
          <CheckCircle2 className="h-4 w-4" /> Lezárva — mindketten értékeltetek. Köszönjük a közös munkát!
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
          <Loader2 className="h-4 w-4" /> Megírtad az értékelést — várakozás a partner értékelésére a lezáráshoz.
        </span>
      )}
    </div>
  );
}

function ReviewPill({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", done ? "border-[#cfe0a8] bg-[#f7faef] text-[#3f6212]" : "border-muted bg-muted/40 text-muted-foreground")}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : <Star className="h-4 w-4" />}
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-xs font-semibold">{done ? "Kész" : "Hiányzik"}</span>
    </div>
  );
}

function ChatCard({
  p,
  pending,
  run,
}: {
  p: ProjectDetail;
  pending: boolean;
  run: (fn: () => Promise<ActionRes>, ok: string, after?: () => void) => void;
}) {
  const [text, setText] = useState("");
  const recent = p.messages.slice(-6);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare className="h-4 w-4 text-[#4d7c0f]" /> Beszélgetés
        </h3>
        <Link href="/creator/messages" className="text-xs font-semibold text-[#4d7c0f] hover:underline">
          Teljes beszélgetés →
        </Link>
      </div>

      {recent.length > 0 ? (
        <div className="mb-3 space-y-2">
          {recent.map((m) => {
            const mine = m.fromUserId === p.myUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", mine ? "bg-accent text-black" : "bg-muted text-foreground")}>
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  <span className={cn("mt-0.5 block text-[10px]", mine ? "text-black/60" : "text-muted-foreground")}>{fmtDateTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mb-3 rounded-xl border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">Még nincs üzenet. Írj a partnerednek a részletek egyeztetéséhez.</p>
      )}

      <div className="flex items-end gap-2">
        <Textarea value={text} rows={2} maxLength={4000} placeholder="Írj üzenetet…" className="resize-none" onChange={(e) => setText(e.target.value)} />
        <Button size="icon" className="h-10 w-10 shrink-0 bg-accent text-black hover:bg-black hover:text-accent" disabled={pending || !text.trim()} onClick={() => run(() => sendProjectMessage(p.id, text), "Üzenet elküldve", () => setText(""))}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
