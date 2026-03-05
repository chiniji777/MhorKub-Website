import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { licenses, customers } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  // Get active license
  const [activeLicense] = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId, customer.id),
        eq(licenses.status, "active"),
        gte(licenses.expiresAt, new Date())
      )
    )
    .orderBy(desc(licenses.expiresAt))
    .limit(1);

  return NextResponse.json({
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    referralCode: customer.referralCode,
    creditBalance: customer.creditBalance,
    license: activeLicense
      ? {
          id: activeLicense.id,
          planId: activeLicense.planId,
          startsAt: activeLicense.startsAt,
          expiresAt: activeLicense.expiresAt,
          status: activeLicense.status,
          autoRenew: activeLicense.autoRenew,
          stripeSubscriptionId: activeLicense.stripeSubscriptionId,
        }
      : null,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  const { name, phone } = await req.json();

  const [updated] = await db
    .update(customers)
    .set({
      ...(name && { name }),
      ...(phone !== undefined && { phone: phone || null }),
    })
    .where(eq(customers.id, customer.id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    phone: updated.phone,
  });
}
