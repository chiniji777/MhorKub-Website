import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { licenses, plans } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    // Check if already used trial
    const [existingTrial] = await db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.customerId, customer.id),
          eq(licenses.planId, 1) // Trial plan ID = 1
        )
      );

    if (existingTrial) {
      return NextResponse.json({ error: "Trial already used" }, { status: 400 });
    }

    // Get trial plan
    const [trialPlan] = await db.select().from(plans).where(eq(plans.id, 1));
    if (!trialPlan) {
      return NextResponse.json({ error: "Trial plan not found" }, { status: 404 });
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + trialPlan.durationDays * 24 * 60 * 60 * 1000);

    const [license] = await db
      .insert(licenses)
      .values({
        customerId: customer.id,
        planId: trialPlan.id,
        startsAt,
        expiresAt,
        status: "active",
      })
      .returning();

    return NextResponse.json({
      message: "Trial activated",
      license: {
        id: license.id,
        startsAt: license.startsAt,
        expiresAt: license.expiresAt,
        status: license.status,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to activate trial" }, { status: 500 });
  }
}
