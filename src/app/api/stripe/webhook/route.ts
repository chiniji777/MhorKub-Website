import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, licenses, plans } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import { createLicenseFromOrder, processReferralCashback } from "@/lib/order-utils";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events. No auth — verified by Stripe signature.
 *
 * Events handled:
 * 1. checkout.session.completed  → order paid, create license
 * 2. invoice.paid (renewal)      → extend license
 * 3. customer.subscription.updated → autoRenew toggle
 * 4. customer.subscription.deleted → subscription ended
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// ─── Event Handlers ──────────────────────────────────────────────

/**
 * checkout.session.completed
 * First-time subscription payment. Mark order paid + create license.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const mhorkubOrderId = session.metadata?.mhorkubOrderId;
  const mhorkubCustomerId = session.metadata?.mhorkubCustomerId;
  const mhorkubPlanId = session.metadata?.mhorkubPlanId;

  if (!mhorkubOrderId || !mhorkubCustomerId || !mhorkubPlanId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  const orderId = parseInt(mhorkubOrderId);
  const customerId = parseInt(mhorkubCustomerId);
  const planId = parseInt(mhorkubPlanId);
  const subscriptionId = session.subscription as string;

  // Check if order already processed
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || order.status === "paid") return;

  // Update order
  await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripeCheckoutSessionId: session.id,
      stripeSubscriptionId: subscriptionId,
    })
    .where(eq(orders.id, orderId));

  // Create license with auto-renew
  await createLicenseFromOrder(orderId, customerId, planId, {
    stripeSubscriptionId: subscriptionId,
    autoRenew: true,
  });

  // Handle referral cashback
  await processReferralCashback(orderId);

  console.log(`✓ Checkout completed: order=${orderId}, sub=${subscriptionId}`);
}

/**
 * invoice.paid (renewal)
 * Recurring payment. Extend existing license or create new one.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Skip first invoice (handled by checkout.session.completed)
  if (invoice.billing_reason === "subscription_create") return;

  // Stripe v20: subscription is at parent.subscription_details.subscription
  const subRef = invoice.parent?.subscription_details?.subscription;
  const subscriptionId =
    typeof subRef === "string" ? subRef : subRef?.id ?? null;
  if (!subscriptionId) return;

  // Find existing license with this subscription
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscriptionId));

  if (!license) {
    console.error("No license found for subscription:", subscriptionId);
    return;
  }

  // Get plan for duration
  const [plan] = await db.select().from(plans).where(eq(plans.id, license.planId));
  if (!plan) return;

  // Extend from current expiresAt (not now) to avoid losing days
  const newExpiresAt = new Date(
    license.expiresAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
  );

  await db
    .update(licenses)
    .set({
      expiresAt: newExpiresAt,
      status: "active",
    })
    .where(eq(licenses.id, license.id));

  // Create order record for renewal
  await db.insert(orders).values({
    customerId: license.customerId,
    planId: license.planId,
    amountThb: plan.priceThb * 100, // satang
    originalAmount: plan.priceThb * 100,
    paymentMethod: "stripe",
    stripeSubscriptionId: subscriptionId,
    stripeInvoiceId: invoice.id,
    status: "paid",
    paidAt: new Date(),
  });

  console.log(`✓ Invoice paid (renewal): sub=${subscriptionId}, expires=${newExpiresAt.toISOString()}`);
}

/**
 * customer.subscription.updated
 * Handle cancel_at_period_end toggle → update autoRenew.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscription.id));

  if (!license) return;

  const autoRenew = !subscription.cancel_at_period_end;

  await db
    .update(licenses)
    .set({ autoRenew })
    .where(eq(licenses.id, license.id));

  console.log(`✓ Subscription updated: sub=${subscription.id}, autoRenew=${autoRenew}`);
}

/**
 * customer.subscription.deleted
 * Subscription ended. License expires naturally — just mark autoRenew false.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscription.id));

  if (!license) return;

  await db
    .update(licenses)
    .set({ autoRenew: false })
    .where(eq(licenses.id, license.id));

  console.log(`✓ Subscription deleted: sub=${subscription.id} — license will expire naturally`);
}
