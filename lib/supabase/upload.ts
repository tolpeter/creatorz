"use client";

import { createClient } from "@/lib/supabase/client";

// Csak a KLIENS oldalon (használói feltöltéseknél) használt bucketök.
// A "blog" bucket szerver-oldali (admin client, lib/blog/generate.ts).
export type Bucket = "avatars" | "banners" | "portfolio" | "logos" | "messages";

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

/**
 * Fájl feltöltése FOLYAMATJELZŐVEL (XHR-rel, mert a Supabase JS upload nem ad
 * progress eseményt). Az onProgress 0..100 közötti százalékot kap.
 */
export async function uploadFileWithProgress(
  bucket: Bucket,
  file: File,
  onProgress: (percent: number) => void
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Nincs bejelentkezve" };

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return { error: "Hiányzó Supabase konfiguráció" };
  const endpoint = `${base}/storage/v1/object/${bucket}/${path}`;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("cache-control", "3600");
    if (file.type) xhr.setRequestHeader("content-type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        onProgress(100);
        resolve({ url: data.publicUrl });
      } else {
        let msg = `HTTP ${xhr.status}`;
        try {
          const j = JSON.parse(xhr.responseText);
          if (j?.message) msg = j.message;
        } catch {
          /* ignore */
        }
        // Tipikus 50 MB feletti hiba: "Payload too large"
        resolve({ error: msg });
      }
    };
    xhr.onerror = () => resolve({ error: "Hálózati hiba a feltöltésnél" });
    xhr.send(file);
  });
}
