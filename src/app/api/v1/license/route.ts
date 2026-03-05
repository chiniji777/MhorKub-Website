import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { licenses, plans } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  const [activeLicense] = await db
    .select({
      id: licenses.id,
      planId: licenses.planId,
      planName: plans.name,
      startsAt: licenses.startsAt,
      expiresAt: licenses.expiresAt,
      status: licenses.status,
      autoRenew: licenses.autoRenew,
      stripeSubscriptionId: licenses.stripeSubscriptionId,
    })
    .from(licenses)
    .innerJoin(plans, eq(plans.id, licenses.planId))
    .where(
      and(
        eq(licenses.customerId, auth.customer.id),
        eq(licenses.status, "active"),
        gte(licenses.expiresAt, new Date())
      )
    )
    .orderBy(desc(licenses.expiresAt))
    .limit(1);

  if (!activeLicense) {
    return NextResponse.json({ active: false, license: null });
  }

  return NextResponse.json({
    active: true,
    license: activeLicense,
  });
}
