"use client";

import { createClient } from "@/lib/supabase/client";

export type Bucket = "avatars" | "banners" | "portfolio" | "logos";

/**
 * Fájl feltöltése a felhasználó saját mappájába (`<authUid>/...`), hogy az
 * RLS policy átengedje. A publikus URL-t adja vissza.
 */
export async function uploadFile(
  bucket: Bucket,
  file: File
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nincs bejelentkezve" };

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
