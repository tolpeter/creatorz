import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type EmailCategory =
  | "messages"
  | "applications"
  | "collaborations"
  | "campaigns"
  | "reviews"
  | "newsletter";

export type EmailPrefs = {
  all?: boolean;
  messages?: boolean;
  applications?: boolean;
  collaborations?: boolean;
  campaigns?: boolean;
  reviews?: boolean;
  newsletter?: boolean;
};

/** A beállítások-oldalon megjelenő kategóriák (sorrend + címke + leírás). */
export const EMAIL_CATEGORY_META: {
  key: EmailCategory;
  label: string;
  description: string;
}[] = [
  { key: "messages", label: "Új üzenet", description: "Ha valaki üzenetet ír neked." },
  { key: "applications", label: "Pályázatok", description: "Új pályázat, elfogadás/elutasítás, meghívás." },
  { key: "collaborations", label: "Együttműködések", description: "Leadás, jóváhagyás, lezárás, megállapodás." },
  { key: "campaigns", label: "Új kampányok és összefoglalók", description: "Hozzád illő új kampányok, heti összefoglaló." },
  { key: "reviews", label: "Értékelések", description: "Ha értékelést kapsz." },
  { key: "newsletter", label: "Hírlevél és tippek", description: "Újdonságok, tippek, ösztönzők a Creatorz-tól." },
];

/**
 * Eldönti, hogy egy adott felhasználónak kiküldhető-e egy adott kategóriájú email.
 * - null/hiányzó beállítás → engedélyezett (alapból mindenről kap).
 * - all === false → MINDEN (nem tranzakciós) email tiltva.
 * - a kategória mezője === false → az a kategória tiltva.
 *
 * FONTOS: a tranzakciós emaileket (jelszó-visszaállítás, emailcím-megerősítés,
 * adminhoz menő értesítések) NEM ezen keresztül küldjük — azok mindig kimennek.
 */
export async function isEmailAllowed(
  userId: string,
  category: EmailCategory,
): Promise<boolean> {
  try {
    const [row] = await db
      .select({ prefs: users.emailPrefs })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const p = row?.prefs as EmailPrefs | null | undefined;
    if (!p) return true;
    if (p.all === false) return false;
    if (p[category] === false) return false;
    return true;
  } catch {
    // Ha bármi gond van (pl. migráció előtt), inkább küldjük ki — best-effort.
    return true;
  }
}
