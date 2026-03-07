import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { customers, licenses, plans } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
    const { planId, startsAt, expiresAt } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const start = startsAt ? new Date(startsAt) : new Date();
    const end = expiresAt
      ? new Date(expiresAt)
      : new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const [license] = await db
      .insert(licenses)
      .values({
        customerId,
        planId,
        orderId: null,
        startsAt: start,
        expiresAt: end,
        status: "active",
        autoRenew: false,
      })
      .returning();

    return NextResponse.json({ license });
  } catch {
    return NextResponse.json({ error: "Failed to grant license" }, { status: 500 });
  }
}

export async function DELETE(
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
    const { licenseId } = await req.json();

    if (!licenseId) {
      return NextResponse.json({ error: "Missing licenseId" }, { status: 400 });
    }

    await db
      .delete(licenses)
      .where(and(eq(licenses.id, licenseId), eq(licenses.customerId, customerId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
  }
}
