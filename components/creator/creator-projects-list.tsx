"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Handshake, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { closeCreatorProject, type CreatorProjectItem } from "@/app/actions/creator-projects";

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d));

export function CreatorProjectsList({ items }: { items: CreatorProjectItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function close(id: string) {
    start(async () => {
      const res = await closeCreatorProject(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Projekt lezárva");
        router.refresh();
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
        <Handshake className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
        Még nincs közös projekted. Egy másik alkotó profilján a „Közös munkára felkérés"
        gombbal indíthatsz egyet — márka nélkül is.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((p) => {
        const closed = p.status === "closed";
        return (
          <div
            key={p.id}
            className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={p.partnerAvatar ?? undefined} />
                <AvatarFallback>{p.partnerName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-bold">{p.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {p.iAmRequester ? "Te hívtad: " : "Téged hívott: "}
                  <Link href={`/creators/${p.partnerUsername}`} className="hover:underline">
                    {p.partnerName}
                  </Link>{" "}
                  · {fmt(p.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {closed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f4e5] px-2.5 py-1 text-xs font-bold text-[#3f6212]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Lezárva
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-[#3f6212]">
                  Aktív
                </span>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href="/creator/messages">
                  <MessageSquare className="h-4 w-4" /> Beszélgetés
                </Link>
              </Button>
              {!closed && (
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => close(p.id)}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Lezárás
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
