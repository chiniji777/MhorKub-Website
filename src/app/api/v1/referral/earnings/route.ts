import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { referralTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  const earnings = await db
    .select()
    .from(referralTransactions)
    .where(eq(referralTransactions.referrerId, auth.customer.id))
    .orderBy(desc(referralTransactions.createdAt))
    .limit(50);

  return NextResponse.json(earnings);
}
