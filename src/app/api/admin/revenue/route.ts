import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders, customers, aiUsageLogs } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";

async function isAuthed() {
  const session = await auth();
  return !!session?.user;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Total revenue from paid orders
    const [revenue] = await db
      .select({ total: sql<number>`coalesce(sum(${orders.amountThb}), 0)` })
      .from(orders)
      .where(eq(orders.status, "paid"));

    // Total customers
    const [customerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers);

    // Total paid orders
    const [orderCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "paid"));

    // AI revenue
    const [aiRevenue] = await db
      .select({
        totalCharged: sql<number>`coalesce(sum(${aiUsageLogs.chargedSatang}), 0)`,
        totalCost: sql<number>`coalesce(sum(${aiUsageLogs.costSatang}), 0)`,
      })
      .from(aiUsageLogs);

    // Revenue by day (last 30 days)
    const revenueByDay = await db
      .select({
        date: sql<string>`to_char(${orders.paidAt}, 'YYYY-MM-DD')`,
        total: sql<number>`sum(${orders.amountThb})`,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(eq(orders.status, "paid"))
      .groupBy(sql`to_char(${orders.paidAt}, 'YYYY-MM-DD')`)
      .orderBy(desc(sql`to_char(${orders.paidAt}, 'YYYY-MM-DD')`))
      .limit(30);

    return NextResponse.json({
      totalRevenue: revenue.total,
      totalRevenueThb: revenue.total / 100,
      totalCustomers: customerCount.count,
      totalPaidOrders: orderCount.count,
      aiRevenue: {
        totalCharged: aiRevenue.totalCharged,
        totalCost: aiRevenue.totalCost,
        profit: aiRevenue.totalCharged - aiRevenue.totalCost,
      },
      revenueByDay,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
