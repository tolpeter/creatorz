"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud, X, Film } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFileWithProgress } from "@/lib/supabase/upload";

const MAX_MB = 50;

/**
 * Bemutatkozó videó feltöltése (1 db, max 50 MB) FOLYAMATJELZŐVEL.
 * A feltöltött videó URL-jét a szülő kapja meg (onChange), ami elmenti.
 */
export function IntroVideoUploader({
  value,
  onChange,
  onUploadedUrl,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onUploadedUrl?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // engedje újra ugyanazt a fájlt
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Csak videófájl tölthető fel");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`A videó max. ${MAX_MB} MB lehet (a tiéd ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      return;
    }

    setUploading(true);
    setProgress(0);
    const res = await uploadFileWithProgress("portfolio", file, setProgress);
    setUploading(false);
    if (res.error || !res.url) {
      const tooLarge = /large|exceed|size/i.test(res.error ?? "");
      toast.error(
        tooLarge
          ? `A videó túl nagy — a feltöltési limit ${MAX_MB} MB.`
          : `Feltöltés sikertelen: ${res.error ?? "ismeretlen hiba"}`
      );
      return;
    }
    onChange(res.url);
    onUploadedUrl?.(res.url);
    toast.success("Bemutatkozó videó feltöltve!");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Bemutatkozó videó</p>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Film className="h-3.5 w-3.5" /> max {MAX_MB} MB · álló (9:16) · kiemelve
          a profilodon
        </span>
      </div>

      {/* Feltöltött videó — álló 9:16, fekete sáv nélkül */}
      {value && (
        <div className="w-[180px] overflow-hidden rounded-xl border bg-black shadow-sm">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={value}
            controls
            playsInline
            className="aspect-[9/16] w-full bg-black object-cover"
          />
        </div>
      )}

      {uploading && (
        <div className="max-w-xs space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Feltöltés… {progress}%
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleSelect}
      />

      {/* Diszkrét gomb */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          {value ? "Videó cseréje" : "Videó feltöltése"}
        </Button>
        {value && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" /> Eltávolítás
          </Button>
        )}
      </div>
    </div>
  );
}
