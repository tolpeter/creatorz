import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const APP = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const prices = {
  monthly: process.env.STRIPE_PRICE_CREATOR_MONTHLY,
  f7: process.env.STRIPE_PRICE_FEATURE_7DAY,
  f30: process.env.STRIPE_PRICE_FEATURE_30DAY,
};

try {
  // Árak ellenőrzése
  for (const [k, id] of Object.entries(prices)) {
    const p = await stripe.prices.retrieve(id);
    console.log(
      `Price ${k}: ${id} → ${(p.unit_amount / 100).toLocaleString("hu-HU")} ${p.currency.toUpperCase()} ${p.recurring ? "(havi)" : "(egyszeri)"} active=${p.active}`
    );
  }

  const customer = await stripe.customers.create({ email: "stripe-test@videmark.hu" });

  const subSession = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: "subscription",
    line_items: [{ price: prices.monthly, quantity: 1 }],
    success_url: `${APP}/creator/subscription?success=true`,
    cancel_url: `${APP}/creator/subscription?canceled=true`,
    locale: "hu",
  });
  console.log("✅ Subscription checkout session:", subSession.url ? "URL OK" : "NINCS URL");

  const feat = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: "payment",
    line_items: [{ price: prices.f7, quantity: 1 }],
    success_url: `${APP}/creator?feature=success`,
    cancel_url: `${APP}/creator/subscription`,
    locale: "hu",
  });
  console.log("✅ Feature(7day) checkout session:", feat.url ? "URL OK" : "NINCS URL");

  // Customer portal (magyar) — teszt config kell hozzá
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${APP}/creator/subscription`,
      locale: "hu",
    });
    console.log("✅ Customer Portal session:", portal.url ? "URL OK (hu)" : "NINCS URL");
  } catch (e) {
    console.log("⚠️ Customer Portal:", e.message, "(a Stripe Dashboard → Billing → Customer portal aktiválása kell)");
  }

  await stripe.customers.del(customer.id);
  console.log("Takarítva.");
} catch (e) {
  console.error("❌ HIBA:", e.message);
  process.exitCode = 1;
}
