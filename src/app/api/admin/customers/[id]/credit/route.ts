import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const customerId = parseInt(idStr);
  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const { amountThb } = await req.json();

    if (!amountThb || amountThb <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const amountSatang = Math.round(amountThb * 100);

    const [updated] = await db
      .update(customers)
      .set({
        creditBalance: sql`${customers.creditBalance} + ${amountSatang}`,
      })
      .where(eq(customers.id, customerId))
      .returning();

    return NextResponse.json({
      success: true,
      newBalance: updated.creditBalance,
    });
  } catch {
    return NextResponse.json({ error: "Failed to add credit" }, { status: 500 });
  }
}
