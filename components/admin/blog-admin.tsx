"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateBlogPostNow,
  toggleBlogStatus,
  deleteBlogPost,
} from "@/app/actions/blog";

export function GenerateButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      onClick={() =>
        start(async () => {
          const res = await generateBlogPostNow();
          if (res.error) toast.error(res.error);
          else toast.success(`Elkészült: ${res.title}`);
        })
      }
      disabled={pending}
      className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {pending ? "Generálás… (~30 mp)" : "Generálj egy bejegyzést most"}
    </Button>
  );
}

export function PostRowActions({
  id,
  slug,
  published,
}: {
  id: string;
  slug: string;
  published: boolean;
}) {
  const [pending, start] = useTransition();
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/blog/${slug}`}
        target="_blank"
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Megnyitás"
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
      <button
        onClick={() =>
          start(async () => {
            const res = await toggleBlogStatus(id, !published);
            if (res.error) toast.error(res.error);
            else toast.success(published ? "Piszkozatba téve" : "Publikálva");
          })
        }
        disabled={pending}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        title={published ? "Piszkozatba" : "Publikálás"}
      >
        {published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        onClick={() =>
          start(async () => {
            if (!confirm("Biztosan törlöd ezt a bejegyzést?")) return;
            const res = await deleteBlogPost(id);
            if (res.error) toast.error(res.error);
            else {
              toast.success("Törölve");
              setRemoved(true);
            }
          })
        }
        disabled={pending}
        className="rounded-md p-2 text-red-500 hover:bg-red-50"
        title="Törlés"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
