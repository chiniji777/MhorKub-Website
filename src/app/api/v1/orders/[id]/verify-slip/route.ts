import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { orders, usedSlipRefs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifySlip } from "@/lib/slipok";
import { activateOrder } from "@/lib/order-utils";
import { validateSlipForPayment } from "@/lib/slip-validator";

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
        debug: slipResult.error || "unknown error",
      });
    }

    // Comprehensive slip validation (timestamp + receiver + amount)
    const validation = validateSlipForPayment({
      slipData: slipResult.data,
      expectedAmountSatang: order.amountThb,
      orderCreatedAt: order.createdAt,
    });

    if (!validation.valid) {
      await db
        .update(orders)
        .set({ status: "pending_review" })
        .where(eq(orders.id, order.id));

      return NextResponse.json({
        status: "pending_review",
        message: "สลิปไม่ผ่านการตรวจสอบ — รอ Admin ตรวจสอบ",
        debug: validation.failReason,
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
  } catch (err) {
    console.error("[orders/verify-slip] Exception:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `ตรวจสอบสลิปล้มเหลว: ${msg}` }, { status: 500 });
  }
}
