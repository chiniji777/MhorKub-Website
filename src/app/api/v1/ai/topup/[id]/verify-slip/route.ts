import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { aiCreditTopups, customers, usedSlipRefs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifySlip } from "@/lib/slipok";

/** Shared logic: credit AI balance after topup approved */
export async function creditTopup(topupId: number, customerId: number, slipRef?: string) {
  const [topup] = await db
    .select()
    .from(aiCreditTopups)
    .where(eq(aiCreditTopups.id, topupId));

  // Update topup status to paid
  await db
    .update(aiCreditTopups)
    .set({
      status: "paid",
      slipVerified: true,
      slipRef: slipRef || "admin-approved",
      paidAt: new Date(),
    })
    .where(eq(aiCreditTopups.id, topupId));

  // Credit balance to customer
  await db
    .update(customers)
    .set({
      creditBalance: sql`${customers.creditBalance} + ${topup.amountThb}`,
    })
    .where(eq(customers.id, customerId));

  // Get updated balance
  const [updated] = await db
    .select({ creditBalance: customers.creditBalance })
    .from(customers)
    .where(eq(customers.id, customerId));

  return { credited: topup.amountThb, newBalance: updated.creditBalance };
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
    const topupId = parseInt(id);
    const { slipImage } = await req.json();

    if (!slipImage) {
      return NextResponse.json({ error: "กรุณาแนบสลิป (base64)" }, { status: 400 });
    }

    // Get topup record
    const [topup] = await db
      .select()
      .from(aiCreditTopups)
      .where(and(eq(aiCreditTopups.id, topupId), eq(aiCreditTopups.customerId, customer.id)));

    if (!topup) {
      return NextResponse.json({ error: "ไม่พบรายการเติมเงิน" }, { status: 404 });
    }

    if (topup.status !== "pending") {
      return NextResponse.json({ error: "รายการนี้ดำเนินการไปแล้ว" }, { status: 400 });
    }

    // Save slip image regardless of verification result
    await db
      .update(aiCreditTopups)
      .set({ slipImage })
      .where(eq(aiCreditTopups.id, topup.id));

    // Try SlipOK auto-verification
    const slipResult = await verifySlip(slipImage);

    // --- SlipOK FAILED → set pending_review for admin ---
    if (!slipResult.success || !slipResult.data) {
      await db
        .update(aiCreditTopups)
        .set({ status: "pending_review" })
        .where(eq(aiCreditTopups.id, topup.id));

      return NextResponse.json({
        status: "pending_review",
        message: "ส่งสลิปแล้ว รอ Admin ตรวจสอบ",
        debug: slipResult.error || "unknown error",
      });
    }

    // Check amount matches
    const expectedAmount = topup.amountThb / 100; // satang → THB
    if (Math.abs(slipResult.data.amount - expectedAmount) > 0.5) {
      await db
        .update(aiCreditTopups)
        .set({ status: "pending_review" })
        .where(eq(aiCreditTopups.id, topup.id));

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
      topupId: topup.id,
    });

    // Credit balance
    const result = await creditTopup(topup.id, customer.id, slipResult.data.transRef);

    return NextResponse.json({
      status: "paid",
      message: "เติมเครดิตสำเร็จ",
      credited: result.credited,
      creditedDisplay: `${result.credited / 100} บาท`,
      newBalance: result.newBalance,
      newBalanceDisplay: `${result.newBalance / 100} บาท`,
    });
  } catch {
    return NextResponse.json({ error: "ตรวจสอบสลิปล้มเหลว" }, { status: 500 });
  }
}
