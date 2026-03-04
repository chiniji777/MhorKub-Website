import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { aiCreditTopups, customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generatePromptpayQR } from "@/lib/promptpay";

export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    const { amountThb } = await req.json();

    if (!amountThb || amountThb < 100) {
      return NextResponse.json({ error: "Minimum top-up is 100 satang (1 THB)" }, { status: 400 });
    }

    // Generate QR for top-up
    const { qrDataUrl, promptpayRef } = await generatePromptpayQR(amountThb);

    // Record top-up (will be verified separately via slip)
    const [topup] = await db
      .insert(aiCreditTopups)
      .values({
        customerId: customer.id,
        amountThb,
      })
      .returning();

    return NextResponse.json({
      topup: { id: topup.id, amountThb },
      qrDataUrl,
      promptpayRef,
      amountDisplay: `${amountThb / 100} THB`,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Top-up failed" }, { status: 500 });
  }
}
