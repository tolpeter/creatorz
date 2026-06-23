import { z } from "zod";

/**
 * Next.js szerver-indítási hook (egyszer fut a szerver indulásakor).
 * Globális MAGYAR Zod-hibaüzenetek: a szerver-action validációs hibák
 * (űrlapok) magyarul jelenjenek meg, ne a Zod angol alapszövegével
 * (pl. "Too small: expected string to have >=5 characters").
 */
export function register() {
  z.config(z.locales.hu());
}
