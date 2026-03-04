import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  return NextResponse.json({
    creditBalance: auth.customer.creditBalance,
    creditBalanceThb: auth.customer.creditBalance / 100,
  });
}
