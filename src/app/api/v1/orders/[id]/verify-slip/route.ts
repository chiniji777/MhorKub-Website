import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { orders, licenses, plans, customers, referralTransactions, usedSlipRefs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifySlip } from "@/lib/slipok";

/** Shared logic: activate license + handle referral cashback */
export async function activateOrder(orderId: number, customerId: number, slipRef?: string) {
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

  // Get order + plan
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  const [plan] = await db.select().from(plans).where(eq(plans.id, order.planId));

  // Create license
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const [license] = await db
    .insert(licenses)
    .values({
      customerId,
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

  return license;
}

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
      return NextResponse.json({ error: "กรุณาแนบสลิป" }, { status: 400 });
    }

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, customer.id)));

    if (!order) {
      return NextResponse.json({ error: "ไม่พบรายการสั่งซื้อ" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "รายการนี้ดำเนินการไปแล้ว" }, { status: 400 });
    }

    // Save slip image regardless of verification result
    await db
      .update(orders)
      .set({ slipImage })
      .where(eq(orders.id, order.id));

    // Try SlipOK auto-verification
    const slipResult = await verifySlip(slipImage);

    // --- SlipOK FAILED → set pending_review for admin ---
    if (!slipResult.success || !slipResult.data) {
      await db
        .update(orders)
        .set({ status: "pending_review" })
        .where(eq(orders.id, order.id));

      return NextResponse.json({
        status: "pending_review",
        message: "ส่งสลิปแล้ว รอ Admin ตรวจสอบ",
      });
    }

    // Check amount matches
    const expectedAmount = order.amountThb / 100;
    if (Math.abs(slipResult.data.amount - expectedAmount) > 0.5) {
      await db
        .update(orders)
        .set({ status: "pending_review" })
        .where(eq(orders.id, order.id));

      return NextResponse.json({
        status: "pending_review",
        message: "ยอดเงินไม่ตรง — รอ Admin ตรวจสอบ",
      });
    }

    // Check slip not reused
    const [usedSlip] = await db
      .select()
      .from(usedSlipRefs)
      .where(eq(usedSlipRefs.transRef, slipResult.data.transRef));

    if (usedSlip) {
      return NextResponse.json({ error: "สลิปนี้ถูกใช้ไปแล้ว" }, { status: 400 });
    }

    // Mark slip as used
    await db.insert(usedSlipRefs).values({
      transRef: slipResult.data.transRef,
      orderId: order.id,
    });

    // Activate order (license + referral)
    const license = await activateOrder(order.id, customer.id, slipResult.data.transRef);

    return NextResponse.json({
      status: "paid",
      message: "ชำระเงินสำเร็จ เปิดใช้งานสิทธิ์แล้ว",
      license: {
        id: license.id,
        startsAt: license.startsAt,
        expiresAt: license.expiresAt,
        status: license.status,
      },
    });
  } catch {
    return NextResponse.json({ error: "ตรวจสอบสลิปล้มเหลว" }, { status: 500 });
  }
}
