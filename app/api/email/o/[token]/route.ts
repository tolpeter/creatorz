import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailCampaignRecipients } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 1×1 átlátszó GIF (tracking pixel).
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

function pixelResponse() {
  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
    },
  });
}

/** Email-megnyitás követése: az első megnyitáskor rögzítjük az időpontot. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (token) {
    try {
      await db
        .update(emailCampaignRecipients)
        .set({ openedAt: new Date() })
        .where(
          and(
            eq(emailCampaignRecipients.token, token),
            isNull(emailCampaignRecipients.openedAt),
          ),
        );
    } catch {
      // best-effort — a pixel mindenképp visszatér
    }
  }
  return pixelResponse();
}
