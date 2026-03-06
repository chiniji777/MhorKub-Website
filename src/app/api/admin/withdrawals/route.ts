import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { withdrawalRequests, customers } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  if (!(await isAdmin())) {
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
  if (!(await isAdmin())) {
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

    // Send notification to customer
    const amountDisplay = (updated.amountThb / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 });
    if (status === "approved") {
      createNotification(
        updated.customerId,
        "withdrawal_approved",
        "คำขอถอนเงินได้รับการอนุมัติ",
        `คำขอถอนเงิน ฿${amountDisplay} ได้รับการอนุมัติแล้วค่ะ`
      ).catch(() => {});
    } else if (status === "rejected") {
      createNotification(
        updated.customerId,
        "withdrawal_rejected",
        "คำขอถอนเงินถูกปฏิเสธ",
        `คำขอถอนเงิน ฿${amountDisplay} ถูกปฏิเสธ เงินได้คืนเข้ายอดเครดิตแล้วค่ะ`
      ).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
