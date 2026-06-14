"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setContactRead, deleteContactMessage } from "@/app/actions/contact";

export function ContactMessageActions({
  id,
  read,
}: {
  id: string;
  read: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null);

  async function toggleRead() {
    setLoading("toggle");
    const res = await setContactRead(id, !read);
    setLoading(null);
    if (res.error) return toast.error(res.error);
    toast.success(read ? "Olvasatlanra állítva" : "Olvasottnak jelölve");
    router.refresh();
  }

  async function remove() {
    setLoading("delete");
    const res = await deleteContactMessage(id);
    setLoading(null);
    if (res.error) return toast.error(res.error);
    toast.success("Üzenet törölve");
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-1.5">
      <Button type="button" variant="outline" size="sm" onClick={toggleRead} disabled={!!loading}>
        {loading === "toggle" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : read ? (
          <RotateCcw className="h-3.5 w-3.5" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {read ? "Olvasatlan" : "Olvasott"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={!!loading}>
        {loading === "delete" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
