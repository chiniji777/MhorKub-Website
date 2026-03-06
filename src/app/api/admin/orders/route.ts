import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { orders, customers } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const whereClause = status ? eq(orders.status, status) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause);

    const data = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        customerEmail: customers.email,
        customerName: customers.name,
        planId: orders.planId,
        amountThb: orders.amountThb,
        originalAmount: orders.originalAmount,
        discountPercent: orders.discountPercent,
        referralCode: orders.referralCode,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        slipVerified: orders.slipVerified,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      orders: data,
      total: countResult.count,
      page,
      totalPages: Math.ceil(countResult.count / limit),
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
