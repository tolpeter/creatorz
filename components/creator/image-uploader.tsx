"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFile, type Bucket } from "@/lib/supabase/upload";
import { cn } from "@/lib/utils";

export function ImageUploader({
  bucket,
  value,
  onChange,
  variant = "banner",
  label,
}: {
  bucket: Bucket;
  value: string | null;
  onChange: (url: string | null) => void;
  variant?: "avatar" | "banner";
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Csak képfájl tölthető fel");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A kép max. 5 MB lehet");
      return;
    }
    setLoading(true);
    const res = await uploadFile(bucket, file);
    setLoading(false);
    if (res.error) {
      toast.error(`Feltöltés sikertelen: ${res.error}`);
      return;
    }
    onChange(res.url ?? null);
    toast.success("Kép feltöltve");
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div
        className={cn(
          "relative overflow-hidden border bg-muted",
          variant === "avatar"
            ? "h-28 w-28 rounded-full"
            : "h-36 w-full rounded-lg dark-gradient"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Nincs kép
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelect}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Feltöltés
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            disabled={loading}
          >
            <X className="h-4 w-4" /> Eltávolítás
          </Button>
        )}
      </div>
    </div>
  );
}
