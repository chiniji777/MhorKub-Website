import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders, aiCreditTopups, customers, plans } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";

async function isAuthed() {
  const session = await auth();
  return !!session?.user;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type"); // "order" | "topup" | null (all)

  try {
    const results: Array<{
      id: number;
      type: "order" | "topup";
      customerName: string | null;
      customerEmail: string | null;
      amountThb: number;
      planName?: string | null;
      status: string;
      hasSlip: boolean;
      createdAt: Date;
    }> = [];

    // Get pending_review orders
    if (!type || type === "order") {
      const pendingOrders = await db
        .select({
          id: orders.id,
          customerName: customers.name,
          customerEmail: customers.email,
          amountThb: orders.amountThb,
          planId: orders.planId,
          planName: plans.name,
          status: orders.status,
          slipImage: orders.slipImage,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(customers, eq(customers.id, orders.customerId))
        .leftJoin(plans, eq(plans.id, orders.planId))
        .where(or(eq(orders.status, "pending_review"), eq(orders.status, "pending")))
        .orderBy(desc(orders.createdAt));

      for (const o of pendingOrders) {
        results.push({
          id: o.id,
          type: "order",
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          amountThb: o.amountThb,
          planName: o.planName,
          status: o.status,
          hasSlip: !!o.slipImage,
          createdAt: o.createdAt,
        });
      }
    }

    // Get pending_review topups
    if (!type || type === "topup") {
      const pendingTopups = await db
        .select({
          id: aiCreditTopups.id,
          customerName: customers.name,
          customerEmail: customers.email,
          amountThb: aiCreditTopups.amountThb,
          status: aiCreditTopups.status,
          slipImage: aiCreditTopups.slipImage,
          createdAt: aiCreditTopups.createdAt,
        })
        .from(aiCreditTopups)
        .leftJoin(customers, eq(customers.id, aiCreditTopups.customerId))
        .where(or(eq(aiCreditTopups.status, "pending_review"), eq(aiCreditTopups.status, "pending")))
        .orderBy(desc(aiCreditTopups.createdAt));

      for (const t of pendingTopups) {
        results.push({
          id: t.id,
          type: "topup",
          customerName: t.customerName,
          customerEmail: t.customerEmail,
          amountThb: t.amountThb,
          status: t.status,
          hasSlip: !!t.slipImage,
          createdAt: t.createdAt,
        });
      }
    }

    // Sort by createdAt desc
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ items: results, total: results.length });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
