import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { withdrawalRequests, customers } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

async function isAuthed() {
  const session = await auth();
  return !!session?.user;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await db
      .select({
        id: withdrawalRequests.id,
        customerId: withdrawalRequests.customerId,
        customerEmail: customers.email,
        customerName: customers.name,
        amountThb: withdrawalRequests.amountThb,
        bankAccount: withdrawalRequests.bankAccount,
        bankName: withdrawalRequests.bankName,
        status: withdrawalRequests.status,
        processedAt: withdrawalRequests.processedAt,
        createdAt: withdrawalRequests.createdAt,
      })
      .from(withdrawalRequests)
      .leftJoin(customers, eq(customers.id, withdrawalRequests.customerId))
      .orderBy(desc(withdrawalRequests.createdAt))
      .limit(50);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !["approved", "rejected", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // If rejected, refund the credit
    if (status === "rejected") {
      const [withdrawal] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, id));

      if (withdrawal && withdrawal.status === "pending") {
        await db
          .update(customers)
          .set({ creditBalance: sql`${customers.creditBalance} + ${withdrawal.amountThb}` })
          .where(eq(customers.id, withdrawal.customerId));
      }
    }

    const [updated] = await db
      .update(withdrawalRequests)
      .set({ status, processedAt: new Date() })
      .where(eq(withdrawalRequests.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
