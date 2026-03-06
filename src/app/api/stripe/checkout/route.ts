import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { plans, orders, customers as customersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mhorkub.com";

/**
 * POST /api/stripe/checkout
 * Create a Stripe Checkout Session for subscription payment.
 * Body: { planId: number, referralCode?: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    const { planId, referralCode } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "กรุณาเลือกแพ็กเกจ" }, { status: 400 });
    }

    // Get plan
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "แพ็กเกจไม่ถูกต้อง" }, { status: 400 });
    }
    if (!plan.stripePriceId) {
      return NextResponse.json({ error: "แพ็กเกจนี้ยังไม่รองรับการชำระผ่านบัตร" }, { status: 400 });
    }

    // Get or create Stripe Customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      customer.id,
      customer.email,
      customer.name
    );

    // Validate referral code (no discount — buyer pays full price, gets cashback later)
    let validReferralCode: string | null = null;

    if (referralCode) {
      const [referrer] = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(eq(customersTable.referralCode, referralCode));

      if (referrer && referrer.id !== customer.id) {
        validReferralCode = referralCode;
      }
    }

    // Create order record — full price, cashback credited after payment
    const originalAmount = plan.priceThb * 100; // satang
    const amountThb = originalAmount;

    const [order] = await db
      .insert(orders)
      .values({
        customerId: customer.id,
        planId: plan.id,
        amountThb,
        originalAmount,
        referralCode: validReferralCode,
        discountPercent: 0,
        paymentMethod: "stripe",
        status: "pending",
      })
      .returning();

    // Build Checkout Session params
    const sessionParams: Record<string, unknown> = {
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${SITE_URL}/dashboard?payment=success&orderId=${order.id}`,
      cancel_url: `${SITE_URL}/dashboard/purchase?payment=cancelled`,
      metadata: {
        mhorkubOrderId: String(order.id),
        mhorkubCustomerId: String(customer.id),
        mhorkubPlanId: String(plan.id),
      },
      subscription_data: {
        metadata: {
          mhorkubCustomerId: String(customer.id),
          mhorkubPlanId: String(plan.id),
        },
      },
    };

    // Store referral code in metadata for cashback processing after payment
    if (validReferralCode) {
      (sessionParams.metadata as Record<string, string>).referralCode = validReferralCode;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getStripe().checkout.sessions.create(sessionParams as any);

    // Save checkout session ID
    await db
      .update(orders)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      checkoutUrl: session.url,
      orderId: order.id,
    });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "ไม่สามารถสร้างรายการชำระเงินได้" }, { status: 500 });
  }
}
