import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { customers, orders, licenses, deviceActivations, plans } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [orderCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.customerId, id));

    const [licenseCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(licenses)
      .where(eq(licenses.customerId, id));

    const [deviceCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deviceActivations)
      .where(eq(deviceActivations.customerId, id));

    const customerLicenses = await db
      .select({
        id: licenses.id,
        planId: licenses.planId,
        planName: plans.name,
        orderId: licenses.orderId,
        startsAt: licenses.startsAt,
        expiresAt: licenses.expiresAt,
        status: licenses.status,
        autoRenew: licenses.autoRenew,
        createdAt: licenses.createdAt,
      })
      .from(licenses)
      .leftJoin(plans, eq(plans.id, licenses.planId))
      .where(eq(licenses.customerId, id))
      .orderBy(desc(licenses.createdAt));

    return NextResponse.json({
      customer,
      orderCount: orderCount.count,
      licenseCount: licenseCount.count,
      deviceCount: deviceCount.count,
      licenses: customerLicenses,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
