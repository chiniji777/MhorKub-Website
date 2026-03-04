import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { referralTransactions, customers } from "@/db/schema";
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
    const [stats] = await db
      .select({
        totalTransactions: sql<number>`count(*)`,
        totalCashback: sql<number>`coalesce(sum(${referralTransactions.amountThb}), 0)`,
      })
      .from(referralTransactions);

    const recent = await db
      .select({
        id: referralTransactions.id,
        referrerId: referralTransactions.referrerId,
        referrerEmail: customers.email,
        referrerName: customers.name,
        orderId: referralTransactions.orderId,
        amountThb: referralTransactions.amountThb,
        credited: referralTransactions.credited,
        createdAt: referralTransactions.createdAt,
      })
      .from(referralTransactions)
      .leftJoin(customers, eq(customers.id, referralTransactions.referrerId))
      .orderBy(desc(referralTransactions.createdAt))
      .limit(50);

    return NextResponse.json({
      stats: {
        totalTransactions: stats.totalTransactions,
        totalCashback: stats.totalCashback,
        totalCashbackThb: stats.totalCashback / 100,
      },
      transactions: recent,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
