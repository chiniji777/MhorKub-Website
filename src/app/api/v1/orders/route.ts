import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { orders, plans, customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generatePromptpayQR } from "@/lib/promptpay";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, auth.customer.id))
    .orderBy(desc(orders.createdAt));

  return NextResponse.json(myOrders);
}

export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    const { planId, referralCode } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!plan || !plan.active || plan.priceThb === 0) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Calculate discount
    let discountPercent = 0;
    let validReferralCode: string | null = null;

    if (referralCode) {
      const [referrer] = await db
        .select({ id: customers.id, referralCode: customers.referralCode })
        .from(customers)
        .where(eq(customers.referralCode, referralCode));

      if (referrer && referrer.id !== customer.id) {
        discountPercent = 10;
        validReferralCode = referralCode;
      }
    }

    const originalAmount = plan.priceThb;
    const amountThb = Math.round(originalAmount * (1 - discountPercent / 100));

    // Generate PromptPay QR
    const { qrDataUrl, promptpayRef } = await generatePromptpayQR(amountThb);

    const [order] = await db
      .insert(orders)
      .values({
        customerId: customer.id,
        planId,
        amountThb,
        originalAmount,
        referralCode: validReferralCode,
        discountPercent,
        promptpayRef,
      })
      .returning();

    return NextResponse.json({
      order: {
        id: order.id,
        amountThb: order.amountThb,
        originalAmount: order.originalAmount,
        discountPercent: order.discountPercent,
        status: order.status,
      },
      qrDataUrl,
      amountDisplay: `${amountThb / 100} THB`,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
