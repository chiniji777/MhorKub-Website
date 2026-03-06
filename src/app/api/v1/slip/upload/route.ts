import { NextRequest, NextResponse } from "next/server";
import { verifySlipUploadToken } from "@/lib/slip-token";
import { db } from "@/db";
import { orders, aiCreditTopups, usedSlipRefs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySlip } from "@/lib/slipok";
import { validateSlipForPayment } from "@/lib/slip-validator";
import { activateOrder } from "@/lib/order-utils";
import { creditTopup } from "@/app/api/v1/ai/topup/[id]/verify-slip/route";

export async function POST(req: NextRequest) {
  try {
    const { token, slipImage } = await req.json();

    if (!token || !slipImage) {
      return NextResponse.json({ error: "token และ slipImage จำเป็นต้องส่งมา" }, { status: 400 });
    }

    // Verify JWT token
    let payload;
    try {
      payload = await verifySlipUploadToken(token);
    } catch {
      return NextResponse.json({ error: "ลิงก์หมดอายุหรือไม่ถูกต้อง" }, { status: 401 });
    }

    const { id, type, customerId } = payload;

    if (type === "order") {
      return handleOrderSlip(id, customerId, slipImage);
    } else {
      return handleTopupSlip(id, customerId, slipImage);
    }
  } catch (err) {
    console.error("[slip/upload] Exception:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `ตรวจสอบสลิปล้มเหลว: ${msg}` }, { status: 500 });
  }
}

async function handleOrderSlip(orderId: number, customerId: number, slipImage: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  if (!order || order.customerId !== customerId) {
    return NextResponse.json({ error: "ไม่พบรายการสั่งซื้อ" }, { status: 404 });
  }
  if (order.status !== "pending") {
    return NextResponse.json({ error: "รายการนี้ดำเนินการไปแล้ว" }, { status: 400 });
  }

  // Save slip image
  await db.update(orders).set({ slipImage }).where(eq(orders.id, order.id));

  // SlipOK verification
  const slipResult = await verifySlip(slipImage);

  if (!slipResult.success || !slipResult.data) {
    await db.update(orders).set({ status: "pending_review" }).where(eq(orders.id, order.id));
    return NextResponse.json({
      status: "pending_review",
      message: "ส่งสลิปแล้ว รอ Admin ตรวจสอบ",
    });
  }

  const validation = validateSlipForPayment({
    slipData: slipResult.data,
    expectedAmountSatang: order.amountThb,
    orderCreatedAt: order.createdAt,
  });

  if (!validation.valid) {
    return NextResponse.json({ status: "rejected", message: validation.failReason });
  }

  // Check slip not reused
  const [usedSlip] = await db.select().from(usedSlipRefs).where(eq(usedSlipRefs.transRef, slipResult.data.transRef));
  if (usedSlip) {
    return NextResponse.json({ status: "rejected", message: "สลิปนี้ถูกใช้ไปแล้ว กรุณาชำระเงินใหม่" });
  }

  await db.insert(usedSlipRefs).values({ transRef: slipResult.data.transRef, orderId: order.id });

  const license = await activateOrder(order.id, customerId, slipResult.data.transRef);

  return NextResponse.json({
    status: "paid",
    message: "ชำระเงินสำเร็จ เปิดใช้งานสิทธิ์แล้ว",
    license: { id: license.id, startsAt: license.startsAt, expiresAt: license.expiresAt, status: license.status },
  });
}

async function handleTopupSlip(topupId: number, customerId: number, slipImage: string) {
  const [topup] = await db.select().from(aiCreditTopups).where(eq(aiCreditTopups.id, topupId));

  if (!topup || topup.customerId !== customerId) {
    return NextResponse.json({ error: "ไม่พบรายการเติมเงิน" }, { status: 404 });
  }
  if (topup.status !== "pending") {
    return NextResponse.json({ error: "รายการนี้ดำเนินการไปแล้ว" }, { status: 400 });
  }

  // Save slip image
  await db.update(aiCreditTopups).set({ slipImage }).where(eq(aiCreditTopups.id, topup.id));

  // SlipOK verification
  const slipResult = await verifySlip(slipImage);

  if (!slipResult.success || !slipResult.data) {
    await db.update(aiCreditTopups).set({ status: "pending_review" }).where(eq(aiCreditTopups.id, topup.id));
    return NextResponse.json({
      status: "pending_review",
      message: "ส่งสลิปแล้ว รอ Admin ตรวจสอบ",
    });
  }

  const validation = validateSlipForPayment({
    slipData: slipResult.data,
    expectedAmountSatang: topup.amountThb,
    orderCreatedAt: topup.createdAt,
  });

  if (!validation.valid) {
    return NextResponse.json({ status: "rejected", message: validation.failReason });
  }

  const [usedSlip] = await db.select().from(usedSlipRefs).where(eq(usedSlipRefs.transRef, slipResult.data.transRef));
  if (usedSlip) {
    return NextResponse.json({ status: "rejected", message: "สลิปนี้ถูกใช้ไปแล้ว กรุณาชำระเงินใหม่" });
  }

  await db.insert(usedSlipRefs).values({ transRef: slipResult.data.transRef, topupId: topup.id });

  const result = await creditTopup(topup.id, customerId, slipResult.data.transRef);

  return NextResponse.json({
    status: "paid",
    message: "เติมเครดิตสำเร็จ",
    credited: result.credited,
    newBalance: result.newBalance,
  });
}
