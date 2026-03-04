import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { orders, licenses, plans, customers, referralTransactions, usedSlipRefs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifySlip } from "@/lib/slipok";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const { slipImage } = await req.json();

    if (!slipImage) {
      return NextResponse.json({ error: "Slip image (base64) is required" }, { status: 400 });
    }

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, customer.id)));

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 });
    }

    // Verify slip with SlipOK
    const slipResult = await verifySlip(slipImage);

    if (!slipResult.success || !slipResult.data) {
      return NextResponse.json({ error: slipResult.error || "Slip verification failed" }, { status: 400 });
    }

    // Check amount matches
    const expectedAmount = order.amountThb / 100;
    if (Math.abs(slipResult.data.amount - expectedAmount) > 0.5) {
      return NextResponse.json({
        error: `Amount mismatch: expected ${expectedAmount} THB, got ${slipResult.data.amount} THB`,
      }, { status: 400 });
    }

    // Check slip not reused
    const [usedSlip] = await db
      .select()
      .from(usedSlipRefs)
      .where(eq(usedSlipRefs.transRef, slipResult.data.transRef));

    if (usedSlip) {
      return NextResponse.json({ error: "This slip has already been used" }, { status: 400 });
    }

    // Mark slip as used
    await db.insert(usedSlipRefs).values({
      transRef: slipResult.data.transRef,
      orderId: order.id,
    });

    // Update order
    await db
      .update(orders)
      .set({
        status: "paid",
        slipVerified: true,
        slipRef: slipResult.data.transRef,
        slipUrl: slipImage.substring(0, 100) + "...",
        paidAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // Get plan and create license
    const [plan] = await db.select().from(plans).where(eq(plans.id, order.planId));
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const [license] = await db
      .insert(licenses)
      .values({
        customerId: customer.id,
        planId: order.planId,
        orderId: order.id,
        startsAt,
        expiresAt,
        status: "active",
      })
      .returning();

    // Handle referral cashback
    if (order.referralCode) {
      const [referrer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.referralCode, order.referralCode));

      if (referrer) {
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
      }
    }

    return NextResponse.json({
      message: "Payment verified, license activated",
      license: {
        id: license.id,
        startsAt: license.startsAt,
        expiresAt: license.expiresAt,
        status: license.status,
      },
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
