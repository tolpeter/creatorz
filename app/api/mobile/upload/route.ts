import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKETS = new Set(["avatars", "logos"]);
const EXT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

/** Kép feltöltése a mobil appból (base64) — szerver oldal, service role. */
export async function POST(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: { bucket?: string; base64?: string; ext?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const bucket = body.bucket ?? "";
  const ext = (body.ext ?? "jpg").toLowerCase().replace(/[^a-z]/g, "");
  if (!BUCKETS.has(bucket)) return Response.json({ error: "invalid bucket" }, { status: 400 });
  if (!body.base64) return Response.json({ error: "missing image" }, { status: 400 });

  const buffer = Buffer.from(body.base64, "base64");
  if (buffer.length > 8 * 1024 * 1024) {
    return Response.json({ error: "A kép túl nagy (max 8 MB)." }, { status: 400 });
  }

  const contentType = EXT_TYPE[ext] ?? "image/jpeg";
  const path = `${user.id}/${randomBytes(12).toString("hex")}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) {
    return Response.json({ error: "Nem sikerült feltölteni a képet." }, { status: 500 });
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
