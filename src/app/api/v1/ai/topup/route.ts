import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { aiCreditTopups } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generatePromptpayQR } from "@/lib/promptpay";
import { signSlipUploadToken, buildSlipUploadUrl } from "@/lib/slip-token";

// GET — list my topups
export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  const topups = await db
    .select()
    .from(aiCreditTopups)
    .where(eq(aiCreditTopups.customerId, auth.customer.id))
    .orderBy(desc(aiCreditTopups.createdAt));

  return NextResponse.json(topups);
}

// POST — create a new topup (pending) and get QR
export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    const { amountThb } = await req.json();

    if (!amountThb || amountThb < 5000) {
      return NextResponse.json({ error: "ยอดเติมขั้นต่ำ 50 บาท" }, { status: 400 });
    }

    // Generate PromptPay QR
    const { qrDataUrl, promptpayRef } = await generatePromptpayQR(amountThb);

    // Record topup as pending
    const [topup] = await db
      .insert(aiCreditTopups)
      .values({
        customerId: customer.id,
        amountThb,
        promptpayRef,
        status: "pending",
      })
      .returning();

    // Generate slip upload token for mobile QR
    const slipUploadToken = await signSlipUploadToken({
      id: topup.id,
      type: "topup",
      customerId: customer.id,
      amountThb: topup.amountThb,
    });

    const slipUploadUrl = buildSlipUploadUrl(slipUploadToken);

    return NextResponse.json({
      topup: { id: topup.id, amountThb, status: topup.status },
      qrDataUrl,
      slipUploadToken,
      slipUploadUrl,
      promptpayRef,
      amountDisplay: `${amountThb / 100} THB`,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Top-up failed" }, { status: 500 });
  }
}
