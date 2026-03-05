import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { withdrawalRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  const withdrawals = await db
    .select()
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.customerId, auth.customer.id))
    .orderBy(desc(withdrawalRequests.createdAt));

  return NextResponse.json({ withdrawals });
}
