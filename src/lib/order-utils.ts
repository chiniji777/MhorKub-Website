import { db } from "@/db";
import { orders, licenses, plans, customers, referralTransactions } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

interface CreateLicenseOptions {
  stripeSubscriptionId?: string;
  autoRenew?: boolean;
  /** Override startsAt (e.g. for extending from current expiresAt) */
  startsAt?: Date;
}

/**
 * Create or extend a license for a paid order.
 * If the customer already has an active license, extends its expiresAt
 * (preserving remaining days). Otherwise creates a new license.
 */
export async function createLicenseFromOrder(
  orderId: number,
  customerId: number,
  planId: number,
  options?: CreateLicenseOptions
) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!plan) throw new Error(`Plan ${planId} not found`);

  const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;
  const now = new Date();

  // Check for existing active license (not expired)
  const [existing] = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId, customerId),
        eq(licenses.status, "active"),
        gte(licenses.expiresAt, now)
      )
    )
    .orderBy(desc(licenses.expiresAt))
    .limit(1);

  if (existing) {
    // Extend from current expiresAt (preserves remaining days)
    const newExpiresAt = new Date(existing.expiresAt.getTime() + durationMs);

    const [updated] = await db
      .update(licenses)
      .set({
        expiresAt: newExpiresAt,
        orderId,
        stripeSubscriptionId: options?.stripeSubscriptionId ?? existing.stripeSubscriptionId,
        autoRenew: options?.autoRenew ?? existing.autoRenew,
      })
      .where(eq(licenses.id, existing.id))
      .returning();

    console.log(
      `[License] Extended #${existing.id}: ${existing.expiresAt.toISOString()} → ${newExpiresAt.toISOString()}`
    );
    return updated;
  }

  // No active license — create new
  const startsAt = options?.startsAt ?? now;
  const expiresAt = new Date(startsAt.getTime() + durationMs);

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
 * - Referrer gets 10% cashback (from buyer using their code)
 * - Buyer also gets 10% cashback (for using a referral code)
 * Both are credited to creditBalance and can be withdrawn.
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
  const cashbackDisplay = (cashbackAmount / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  // 1. Referrer cashback (10%)
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

  createNotification(
    referrer.id,
    "referral_purchase",
    "ได้รับเงินคืนจากการแนะนำ!",
    `คุณได้รับเงินคืน ฿${cashbackDisplay} จากการซื้อของคนที่คุณแนะนำ`
  ).catch(() => {});

  // 2. Buyer cashback (10%) — buyer pays full price but gets cashback to wallet
  await db.insert(referralTransactions).values({
    referrerId: order.customerId,
    orderId: order.id,
    amountThb: cashbackAmount,
    credited: true,
  });

  await db
    .update(customers)
    .set({ creditBalance: sql`${customers.creditBalance} + ${cashbackAmount}` })
    .where(eq(customers.id, order.customerId));

  createNotification(
    order.customerId,
    "referral_purchase",
    "ได้รับเงินคืนจากการใช้รหัสแนะนำ!",
    `คุณได้รับเงินคืน ฿${cashbackDisplay} จากการใช้รหัสแนะนำในการซื้อ`
  ).catch(() => {});

  return { referrerId: referrer.id, buyerId: order.customerId, cashbackAmount };
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
