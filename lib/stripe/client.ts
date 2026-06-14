import "server-only";
import Stripe from "stripe";

/**
 * Lusta inicializálás — különben a `new Stripe(undefined)` build-time
 * crash-elne, ha a STRIPE_SECRET_KEY még nincs beállítva (pl. első Vercel
 * deploy env-változók előtt). Hívóhelyen használd: `getStripe()`.
 *
 * A korábbi `stripe` named export kompatibilitásból megmaradt, de mostantól
 * egy Proxy, ami az első hozzáférésig nem dob.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY hiányzik — a Stripe nem konfigurált");
  }
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
  }
  return cached;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe() as unknown as object, prop);
  },
});
