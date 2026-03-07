import { NextRequest, NextResponse } from "next/server";
import { verifySlipUploadToken } from "@/lib/slip-token";
import { db } from "@/db";
import { aiCreditTopups, orders, usedSlipRefs, customers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifySlip } from "@/lib/slipok";
import { validateSlipForPayment } from "@/lib/slip-validator";
import { creditTopup } from "@/app/api/v1/ai/topup/[id]/verify-slip/route";
import { activateOrder } from "@/lib/order-utils";

/**
 * POST /api/v1/upload-slip
 *
 * Token-based slip upload — no login required.
 * The JWT token (from QR code URL) contains { type, id, customerId }.
 * This allows uploading slip from a mobile phone without being logged in.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, slipImage } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }
    if (!slipImage) {
      return NextResponse.json({ error: "กรุณาแนบสลิป" }, { status: 400 });
    }

    // Verify token
    let payload;
    try {
      payload = await verifySlipUploadToken(token);
    } catch {
      return NextResponse.json(
        { error: "ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาสร้าง QR ใหม่" },
        { status: 401 }
      );
    }

    if (payload.type === "topup") {
      return handleTopupSlip(payload.id, payload.customerId, slipImage);
    } else if (payload.type === "order") {
      return handleOrderSlip(payload.id, payload.customerId, slipImage);
    }

    return NextResponse.json({ error: "Invalid token type" }, { status: 400 });
  } catch (err) {
    console.error("[upload-slip] Exception:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `อัปโหลดสลิปล้มเหลว: ${msg}` }, { status: 500 });
  }
}

/** Handle topup slip (same logic as /api/v1/ai/topup/[id]/verify-slip) */
async function handleTopupSlip(topupId: number, customerId: number, slipImage: string) {
  const [topup] = await db
    .select()
    .from(aiCreditTopups)
    .where(and(eq(aiCreditTopups.id, topupId), eq(aiCreditTopups.customerId, customerId)));

  if (!topup) {
    return NextResponse.json({ error: "ไม่พบรายการเติมเงิน" }, { status: 404 });
  }

  if (topup.status !== "pending") {
    return NextResponse.json({
      error: "รายการนี้ดำเนินการไปแล้ว",
      status: topup.status,
    }, { status: 400 });
  }

  // Save slip image
  await db
    .update(aiCreditTopups)
    .set({ slipImage })
    .where(eq(aiCreditTopups.id, topup.id));

  // SlipOK auto-verification
  const slipResult = await verifySlip(slipImage);

  if (!slipResult.success || !slipResult.data) {
    await db
      .update(aiCreditTopups)
      .set({ status: "pending_review" })
      .where(eq(aiCreditTopups.id, topup.id));

    return NextResponse.json({
      status: "pending_review",
      message: "ส่งสลิปแล้ว รอ Admin ตรวจสอบ",
    });
  }

  // Validate slip
  const validation = validateSlipForPayment({
    slipData: slipResult.data,
    expectedAmountSatang: topup.amountThb,
    orderCreatedAt: topup.createdAt,
  });

  if (!validation.valid) {
    return NextResponse.json({
      status: "rejected",
      message: validation.failReason,
    });
  }

  // Check reuse
  const [usedSlip] = await db
    .select()
    .from(usedSlipRefs)
    .where(eq(usedSlipRefs.transRef, slipResult.data.transRef));

  if (usedSlip) {
    return NextResponse.json({
      status: "rejected",
      message: "สลิปนี้ถูกใช้ไปแล้ว กรุณาชำระเงินใหม่",
    });
  }

  // Mark used
  await db.insert(usedSlipRefs).values({
    transRef: slipResult.data.transRef,
    topupId: topup.id,
  });

  // Credit
  const result = await creditTopup(topup.id, customerId, slipResult.data.transRef);

  return NextResponse.json({
    status: "paid",
    message: "เติมเครดิตสำเร็จ",
    credited: result.credited,
    creditedDisplay: `${result.credited / 100} บาท`,
    newBalance: result.newBalance,
  });
}

/** Handle order slip (same logic as /api/v1/orders/[id]/verify-slip) */
async function handleOrderSlip(orderId: number, customerId: number, slipImage: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)));

  if (!order) {
    return NextResponse.json({ error: "ไม่พบรายการสั่งซื้อ" }, { status: 404 });
  }

  if (order.status !== "pending") {
    return NextResponse.json({
      error: "รายการนี้ดำเนินการไปแล้ว",
      status: order.status,
    }, { status: 400 });
  }

  // Save slip image
  await db
    .update(orders)
    .set({ slipImage })
    .where(eq(orders.id, order.id));

  // SlipOK auto-verification
  const slipResult = await verifySlip(slipImage);

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

  // Validate slip
  const validation = validateSlipForPayment({
    slipData: slipResult.data,
    expectedAmountSatang: order.amountThb,
    orderCreatedAt: order.createdAt,
  });

  if (!validation.valid) {
    return NextResponse.json({
      status: "rejected",
      message: validation.failReason,
    });
  }

  // Check reuse
  const [usedSlip] = await db
    .select()
    .from(usedSlipRefs)
    .where(eq(usedSlipRefs.transRef, slipResult.data.transRef));

  if (usedSlip) {
    return NextResponse.json({
      status: "rejected",
      message: "สลิปนี้ถูกใช้ไปแล้ว กรุณาชำระเงินใหม่",
    });
  }

  // Mark used
  await db.insert(usedSlipRefs).values({
    transRef: slipResult.data.transRef,
    orderId: order.id,
  });

  // Activate order
  const license = await activateOrder(order.id, customerId, slipResult.data.transRef);

  return NextResponse.json({
    status: "paid",
    message: "ชำระเงินสำเร็จ เปิดใช้งานสิทธิ์แล้ว",
    license: {
      id: license.id,
      startsAt: license.startsAt,
      expiresAt: license.expiresAt,
    },
  });
}
