import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, creatorProfiles, brandProfiles } from "@/lib/db/schema";

export type ViewerIdentity = {
  userId: string;
  name: string;
  type: "creator" | "brand" | "user";
  username: string | null;
  avatarUrl: string | null;
};

/**
 * Felhasználó-id-k feloldása megjeleníthető identitásra (creator név + avatar,
 * vagy márka cégnév + logó). A "látja a megtekintőket" funkcióhoz.
 */
export async function resolveViewers(
  userIds: string[],
): Promise<Map<string, ViewerIdentity>> {
  const map = new Map<string, ViewerIdentity>();
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return map;

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      creatorName: creatorProfiles.displayName,
      username: creatorProfiles.username,
      avatarUrl: creatorProfiles.avatarUrl,
      brandName: brandProfiles.companyName,
      brandLogo: brandProfiles.logoUrl,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .leftJoin(brandProfiles, eq(brandProfiles.userId, users.id))
    .where(inArray(users.id, ids));

  for (const r of rows) {
    if (r.creatorName) {
      map.set(r.userId, {
        userId: r.userId,
        name: r.creatorName,
        type: "creator",
        username: r.username,
        avatarUrl: r.avatarUrl,
      });
    } else if (r.brandName) {
      map.set(r.userId, {
        userId: r.userId,
        name: r.brandName,
        type: "brand",
        username: null,
        avatarUrl: r.brandLogo,
      });
    } else {
      map.set(r.userId, {
        userId: r.userId,
        name: r.email ?? "Felhasználó",
        type: "user",
        username: null,
        avatarUrl: null,
      });
    }
  }
  return map;
}
