import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { customers, aiUsageLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * POST /api/v1/ai/deduct
 * Electron app reports AI usage and deducts from cloud creditBalance.
 */
export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  try {
    const { chargedSatang, model, promptTokens, completionTokens, costSatang } =
      await req.json();

    if (!chargedSatang || chargedSatang <= 0) {
      return NextResponse.json(
        { error: "chargedSatang is required and must be > 0" },
        { status: 400 }
      );
    }

    // Check sufficient balance
    const [customer] = await db
      .select({ creditBalance: customers.creditBalance })
      .from(customers)
      .where(eq(customers.id, auth.customer.id));

    if (!customer || customer.creditBalance < chargedSatang) {
      return NextResponse.json(
        { error: "Insufficient credit balance" },
        { status: 400 }
      );
    }

    // Deduct from creditBalance
    await db
      .update(customers)
      .set({
        creditBalance: sql`${customers.creditBalance} - ${Math.round(chargedSatang)}`,
      })
      .where(eq(customers.id, auth.customer.id));

    // Log AI usage
    await db.insert(aiUsageLogs).values({
      customerId: auth.customer.id,
      provider: "openai",
      model: model || "unknown",
      promptTokens: promptTokens || 0,
      completionTokens: completionTokens || 0,
      costSatang: costSatang || 0,
      chargedSatang: Math.round(chargedSatang),
    });

    // Fetch updated balance
    const [updated] = await db
      .select({ creditBalance: customers.creditBalance })
      .from(customers)
      .where(eq(customers.id, auth.customer.id));

    return NextResponse.json({
      success: true,
      newBalance: updated.creditBalance, // satang
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to deduct AI credit" },
      { status: 500 }
    );
  }
}
