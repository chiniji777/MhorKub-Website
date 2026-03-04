import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { aiUsageLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  const usage = await db
    .select()
    .from(aiUsageLogs)
    .where(eq(aiUsageLogs.customerId, auth.customer.id))
    .orderBy(desc(aiUsageLogs.createdAt))
    .limit(50);

  return NextResponse.json(usage);
}
