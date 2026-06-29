"use client";

import { createClient } from "@/lib/supabase/client";

// Csak a KLIENS oldalon (használói feltöltéseknél) használt bucketök.
// A "blog" bucket szerver-oldali (admin client, lib/blog/generate.ts).
export type Bucket = "avatars" | "banners" | "portfolio" | "logos" | "messages";

// 1 év — a fájlnevek egyediek (UUID), így a hosszú cache sosem ad elavult képet.
// Ez drasztikusan csökkenti a Supabase Storage egresst (böngésző + CDN cache).
const LONG_CACHE = "31536000";

// Bucketenkénti max. élhossz (px). Az ennél nagyobb képeket átméretezzük
// feltöltés előtt — így töredékére csökken a tárolt méret ÉS a kiszolgált
// sávszélesség (egress). A "messages" csatolmány bármi lehet → nem méretezzük.
const MAX_DIM: Partial<Record<Bucket, number>> = {
  avatars: 600,
  logos: 600,
  banners: 1600,
  portfolio: 1920,
};

type Prepared = { body: Blob; ext: string; type: string };

/**
 * Ha a fájl kép és van rá max. méret, átméretezi (arányosan) és webp-be
 * tömöríti egy canvas-szal. Hibánál / nem-kép esetén az eredetit adja vissza.
 */
async function prepare(bucket: Bucket, file: File): Promise<Prepared> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const fallback: Prepared = { body: file, ext, type: file.type || "application/octet-stream" };

  const maxDim = MAX_DIM[bucket];
  if (!maxDim || !file.type.startsWith("image/") || file.type === "image/gif") {
    return fallback;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/webp", 0.82),
    );
    if (!blob) return fallback;
    // Csak akkor használjuk az átméretezettet, ha tényleg kisebb lett.
    if (blob.size >= file.size && scale === 1) return fallback;
    return { body: blob, ext: "webp", type: "image/webp" };
  } catch {
    return fallback; // pl. HEIC, amit a böngésző nem dekódol
  }
}

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

  const prepared = await prepare(bucket, file);
  const path = `${user.id}/${crypto.randomUUID()}.${prepared.ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, prepared.body, {
    cacheControl: LONG_CACHE,
    upsert: true,
    contentType: prepared.type,
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

  const prepared = await prepare(bucket, file);
  const path = `${session.user.id}/${crypto.randomUUID()}.${prepared.ext}`;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return { error: "Hiányzó Supabase konfiguráció" };
  const endpoint = `${base}/storage/v1/object/${bucket}/${path}`;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("cache-control", LONG_CACHE);
    if (prepared.type) xhr.setRequestHeader("content-type", prepared.type);
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
    xhr.send(prepared.body);
  });
}
