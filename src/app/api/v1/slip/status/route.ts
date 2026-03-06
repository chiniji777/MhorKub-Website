import { NextRequest, NextResponse } from "next/server";
import { verifySlipUploadToken } from "@/lib/slip-token";
import { db } from "@/db";
import { orders, aiCreditTopups, licenses, customers } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  let payload;
  try {
    payload = await verifySlipUploadToken(token);
  } catch {
    return NextResponse.json({ error: "ลิงก์หมดอายุหรือไม่ถูกต้อง" }, { status: 401 });
  }

  const { id, type, customerId } = payload;

  if (type === "order") {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order || order.customerId !== customerId) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }

    const uploaded = order.slipImage !== null;
    const result: Record<string, unknown> = {
      uploaded,
      status: order.status,
    };

    // If paid, include license info
    if (order.status === "paid") {
      const [license] = await db
        .select()
        .from(licenses)
        .where(and(eq(licenses.orderId, id), gte(licenses.expiresAt, new Date())));

      if (license) {
        result.license = {
          id: license.id,
          startsAt: license.startsAt,
          expiresAt: license.expiresAt,
          status: license.status,
        };
      }
      result.message = "ชำระเงินสำเร็จ เปิดใช้งานสิทธิ์แล้ว";
    } else if (order.status === "pending_review") {
      result.message = "ส่งสลิปแล้ว รอ Admin ตรวจสอบ";
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } else {
    const [topup] = await db.select().from(aiCreditTopups).where(eq(aiCreditTopups.id, id));
    if (!topup || topup.customerId !== customerId) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }

    const uploaded = topup.slipImage !== null;
    const result: Record<string, unknown> = {
      uploaded,
      status: topup.status,
    };

    if (topup.status === "paid") {
      result.message = "เติมเครดิตสำเร็จ";
      // Include new balance for desktop polling
      const [cust] = await db
        .select({ creditBalance: customers.creditBalance })
        .from(customers)
        .where(eq(customers.id, customerId));
      if (cust) result.newBalance = cust.creditBalance;
    } else if (topup.status === "pending_review") {
      result.message = "ส่งสลิปแล้ว รอ Admin ตรวจสอบ";
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }
}
