import { db } from "@/db";
import { orders, licenses, plans, customers, referralTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface CreateLicenseOptions {
  stripeSubscriptionId?: string;
  autoRenew?: boolean;
  /** Override startsAt (e.g. for extending from current expiresAt) */
  startsAt?: Date;
}

/**
 * Create a license for a paid order.
 * Used by both PromptPay (verify-slip) and Stripe (webhook) flows.
 */
export async function createLicenseFromOrder(
  orderId: number,
  customerId: number,
  planId: number,
  options?: CreateLicenseOptions
) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!plan) throw new Error(`Plan ${planId} not found`);

  const startsAt = options?.startsAt ?? new Date();
  const expiresAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const [license] = await db
    .insert(licenses)
    .values({
      customerId,
      planId,
      orderId,
      startsAt,
      expiresAt,
      status: "active",
      stripeSubscriptionId: options?.stripeSubscriptionId ?? null,
      autoRenew: options?.autoRenew ?? false,
    })
    .returning();

  return license;
}

/**
 * Process referral cashback for an order.
 * Gives 10% of order amount to the referrer.
 */
export async function processReferralCashback(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order?.referralCode) return null;

  const [referrer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.referralCode, order.referralCode));

  if (!referrer) return null;

  const cashbackAmount = Math.round(order.amountThb * 0.1);

  await db.insert(referralTransactions).values({
    referrerId: referrer.id,
    orderId: order.id,
    amountThb: cashbackAmount,
    credited: true,
  });

  await db
    .update(customers)
    .set({ creditBalance: sql`${customers.creditBalance} + ${cashbackAmount}` })
    .where(eq(customers.id, referrer.id));

  return { referrerId: referrer.id, cashbackAmount };
}

/**
 * Full order activation: mark paid → create license → process referral.
 * Replaces the old activateOrder() export from verify-slip.
 */
export async function activateOrder(
  orderId: number,
  customerId: number,
  slipRef?: string,
  options?: CreateLicenseOptions
) {
  // Update order to paid
  await db
    .update(orders)
    .set({
      status: "paid",
      slipVerified: true,
      slipRef: slipRef || "admin-approved",
      paidAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Get order for planId
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  // Create license
  const license = await createLicenseFromOrder(orderId, customerId, order.planId, options);

  // Handle referral cashback
  await processReferralCashback(orderId);

  return license;
}
