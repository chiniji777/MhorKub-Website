import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { withdrawalRequests, customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    const { amountThb, bankAccount, bankName } = await req.json();

    if (!amountThb || !bankAccount || !bankName) {
      return NextResponse.json({ error: "Amount, bank account, and bank name are required" }, { status: 400 });
    }

    if (amountThb < 1) {
      return NextResponse.json({ error: "จำนวนเงินต้องมากกว่า 0" }, { status: 400 });
    }

    if (amountThb > customer.creditBalance) {
      return NextResponse.json({ error: "Insufficient credit balance" }, { status: 400 });
    }

    // Deduct from balance
    await db
      .update(customers)
      .set({ creditBalance: sql`${customers.creditBalance} - ${amountThb}` })
      .where(eq(customers.id, customer.id));

    const [request] = await db
      .insert(withdrawalRequests)
      .values({
        customerId: customer.id,
        amountThb,
        bankAccount,
        bankName,
      })
      .returning();

    return NextResponse.json({
      message: "Withdrawal request submitted",
      request: {
        id: request.id,
        amountThb: request.amountThb,
        amountDisplay: `${request.amountThb / 100} THB`,
        status: request.status,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Withdrawal request failed" }, { status: 500 });
  }
}
