import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { referralTransactions, customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  // Count referrals
  const [stats] = await db
    .select({
      totalReferrals: sql<number>`count(*)`,
      totalEarnings: sql<number>`coalesce(sum(${referralTransactions.amountThb}), 0)`,
    })
    .from(referralTransactions)
    .where(eq(referralTransactions.referrerId, customer.id));

  // Count referred customers
  const [referredCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(eq(customers.referredBy, customer.id));

  return NextResponse.json({
    referralCode: customer.referralCode,
    creditBalance: customer.creditBalance,
    creditBalanceThb: customer.creditBalance / 100,
    totalReferrals: referredCount.count,
    totalEarnings: stats.totalEarnings,
    totalEarningsThb: stats.totalEarnings / 100,
  });
}
