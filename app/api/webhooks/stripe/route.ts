import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { subscriptions, featurePurchases, creatorProfiles } from "@/lib/db/schema";

type SubStatus = "active" | "past_due" | "canceled" | "unpaid" | "incomplete";

function mapStatus(status: string): SubStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "paused":
      return "canceled";
    case "unpaid":
      return "unpaid";
    default:
      return "incomplete";
  }
}

// A Stripe 2025 API-ban a periódus a subscription item szintjén van.
function periods(sub: Stripe.Subscription): { start: Date | null; end: Date | null } {
  const item = sub.items?.data?.[0] as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const legacy = sub as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const start = item?.current_period_start ?? legacy.current_period_start;
  const end = item?.current_period_end ?? legacy.current_period_end;
  return {
    start: start ? new Date(start * 1000) : null,
    end: end ? new Date(end * 1000) : null,
  };
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription") {
          const userId = session.metadata?.userId;
          if (!userId) break;
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const p = periods(sub);

          await db
            .insert(subscriptions)
            .values({
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: sub.id,
              status: mapStatus(sub.status),
              currentPeriodStart: p.start,
              currentPeriodEnd: p.end,
            })
            .onConflictDoUpdate({
              target: subscriptions.userId,
              set: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: sub.id,
                status: mapStatus(sub.status),
                currentPeriodStart: p.start,
                currentPeriodEnd: p.end,
                updatedAt: new Date(),
              },
            });
        } else if (session.mode === "payment") {
          const type = session.metadata?.type;
          const creatorProfileId = session.metadata?.creatorProfileId;
          if (
            (type === "feature_7day" || type === "feature_30day") &&
            creatorProfileId
          ) {
            const days = type === "feature_7day" ? 7 : 30;
            const amountHuf =
              type === "feature_7day"
                ? Number(process.env.NEXT_PUBLIC_FEATURE_7DAY_PRICE_HUF ?? 3990)
                : Number(process.env.NEXT_PUBLIC_FEATURE_30DAY_PRICE_HUF ?? 5990);
            const startsAt = new Date();
            const endsAt = new Date(startsAt.getTime() + days * 86400000);

            await db
              .insert(featurePurchases)
              .values({
                creatorId: creatorProfileId,
                type: type === "feature_7day" ? "7day" : "30day",
                stripePaymentIntentId: session.payment_intent as string,
                amountHuf,
                startsAt,
                endsAt,
              })
              .onConflictDoNothing({ target: featurePurchases.stripePaymentIntentId });

            await db
              .update(creatorProfiles)
              .set({ isFeatured: true, featuredUntil: endsAt })
              .where(eq(creatorProfiles.id, creatorProfileId));
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const p = periods(sub);
        await db
          .update(subscriptions)
          .set({
            status: mapStatus(sub.status),
            currentPeriodEnd: p.end,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { subscription?: string };
        if (invoice.subscription) {
          await db
            .update(subscriptions)
            .set({ status: "past_due", updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription));
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook Handler Error", { status: 500 });
  }
}
