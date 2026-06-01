"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { getCurrentUser, getCurrentCreator } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Meglévő vagy új Stripe customer id a userhez. */
async function getOrCreateCustomerId(userId: string, email: string): Promise<string> {
  const existing = await db
    .select({ customerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  if (existing[0]?.customerId) return existing[0].customerId;

  const found = await stripe.customers.list({ email, limit: 1 });
  if (found.data[0]) return found.data[0].id;

  const customer = await stripe.customers.create({ email, metadata: { userId } });
  return customer.id;
}

export async function startCreatorSubscription() {
  const current = await getCurrentUser();
  if (!current?.dbUser || current.dbUser.role !== "creator") {
    return { error: "Csak creator fizethet elő" };
  }

  const customerId = await getOrCreateCustomerId(
    current.dbUser.id,
    current.authUser.email!
  );

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_CREATOR_MONTHLY!, quantity: 1 }],
    success_url: `${APP_URL}/creator/subscription?success=true`,
    cancel_url: `${APP_URL}/creator/subscription?canceled=true`,
    locale: "hu",
    billing_address_collection: "required",
    metadata: { userId: current.dbUser.id, kind: "subscription" },
  });

  if (!session.url) return { error: "Nem sikerült létrehozni a fizetést" };
  redirect(session.url);
}

export async function purchaseFeature(type: "7day" | "30day") {
  const current = await getCurrentUser();
  const creator = await getCurrentCreator();
  if (!current?.dbUser || !creator) return { error: "Csak creator vásárolhat kiemelést" };

  const priceId =
    type === "7day"
      ? process.env.STRIPE_PRICE_FEATURE_7DAY!
      : process.env.STRIPE_PRICE_FEATURE_30DAY!;

  const customerId = await getOrCreateCustomerId(
    current.dbUser.id,
    current.authUser.email!
  );

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/creator?feature=success`,
    cancel_url: `${APP_URL}/creator/subscription?feature=canceled`,
    locale: "hu",
    metadata: {
      kind: "feature",
      type: `feature_${type}`,
      creatorProfileId: creator.profile.id,
      userId: current.dbUser.id,
    },
  });

  if (!session.url) return { error: "Nem sikerült létrehozni a fizetést" };
  redirect(session.url);
}

export async function openCustomerPortal() {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs bejelentkezve" };

  const rows = await db
    .select({ customerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, current.dbUser.id))
    .limit(1);

  if (!rows[0]?.customerId) return { error: "Nincs aktív előfizetésed" };

  const session = await stripe.billingPortal.sessions.create({
    customer: rows[0].customerId,
    return_url: `${APP_URL}/creator/subscription`,
    locale: "hu",
  });

  redirect(session.url);
}
