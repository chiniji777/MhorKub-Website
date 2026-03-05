import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if ("error" in auth) return auth.error;

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.customerId, auth.customer.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.customerId, auth.customer.id),
        eq(notifications.read, false)
      )
    );

  return NextResponse.json({
    notifications: rows,
    unreadCount: countRow?.count ?? 0,
  });
}
