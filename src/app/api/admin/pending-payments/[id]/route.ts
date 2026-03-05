import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders, aiCreditTopups, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { activateOrder } from "@/lib/order-utils";
import { creditTopup } from "@/app/api/v1/ai/topup/[id]/verify-slip/route";

async function isAuthed() {
  const session = await auth();
  return !!session?.user;
}

// GET — view slip image for a specific pending payment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const itemId = parseInt(id);
  const type = req.nextUrl.searchParams.get("type"); // "order" | "topup"

  try {
    if (type === "order") {
      const [order] = await db
        .select({
          id: orders.id,
          customerId: orders.customerId,
          customerName: customers.name,
          customerEmail: customers.email,
          amountThb: orders.amountThb,
          status: orders.status,
          slipImage: orders.slipImage,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(customers, eq(customers.id, orders.customerId))
        .where(eq(orders.id, itemId));

      if (!order) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(order);
    }

    if (type === "topup") {
      const [topup] = await db
        .select({
          id: aiCreditTopups.id,
          customerId: aiCreditTopups.customerId,
          customerName: customers.name,
          customerEmail: customers.email,
          amountThb: aiCreditTopups.amountThb,
          status: aiCreditTopups.status,
          slipImage: aiCreditTopups.slipImage,
          createdAt: aiCreditTopups.createdAt,
        })
        .from(aiCreditTopups)
        .leftJoin(customers, eq(customers.id, aiCreditTopups.customerId))
        .where(eq(aiCreditTopups.id, itemId));

      if (!topup) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(topup);
    }

    return NextResponse.json({ error: "type param required (order|topup)" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST — approve or reject a pending payment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const itemId = parseInt(id);
  const { type, action } = await req.json(); // type: "order"|"topup", action: "approve"|"reject"

  if (!type || !action) {
    return NextResponse.json({ error: "type and action required" }, { status: 400 });
  }

  try {
    // --- APPROVE ORDER ---
    if (type === "order" && action === "approve") {
      const [order] = await db.select().from(orders).where(eq(orders.id, itemId));
      if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (order.status !== "pending_review" && order.status !== "pending") {
        return NextResponse.json({ error: "Order already processed" }, { status: 400 });
      }

      const license = await activateOrder(order.id, order.customerId, "admin-approved");

      return NextResponse.json({
        message: "Order approved — License activated",
        license: { id: license.id, expiresAt: license.expiresAt },
      });
    }

    // --- APPROVE TOPUP ---
    if (type === "topup" && action === "approve") {
      const [topup] = await db.select().from(aiCreditTopups).where(eq(aiCreditTopups.id, itemId));
      if (!topup) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (topup.status !== "pending_review" && topup.status !== "pending") {
        return NextResponse.json({ error: "Topup already processed" }, { status: 400 });
      }

      const result = await creditTopup(topup.id, topup.customerId, "admin-approved");

      return NextResponse.json({
        message: "Topup approved — Credit added",
        credited: result.credited,
        newBalance: result.newBalance,
      });
    }

    // --- REJECT ---
    if (action === "reject") {
      if (type === "order") {
        await db.update(orders).set({ status: "failed" }).where(eq(orders.id, itemId));
      } else if (type === "topup") {
        await db.update(aiCreditTopups).set({ status: "failed" }).where(eq(aiCreditTopups.id, itemId));
      }
      return NextResponse.json({ message: "Rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Admin approve/reject error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
