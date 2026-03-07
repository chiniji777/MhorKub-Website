import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { customers, orders, licenses, deviceActivations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

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

    return NextResponse.json({
      customer,
      orderCount: orderCount.count,
      licenseCount: licenseCount.count,
      deviceCount: deviceCount.count,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
