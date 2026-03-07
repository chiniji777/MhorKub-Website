import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ valid: false, error: "Referral code is required" }, { status: 400 });
  }

  // Check if it's the user's own code
  if (customer.referralCode?.toUpperCase() === code.toUpperCase()) {
    return NextResponse.json({ valid: false, isSelf: true, error: "Cannot use your own referral code" });
  }

  // Look up the referrer
  const [referrer] = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.referralCode, code));

  if (!referrer) {
    return NextResponse.json({ valid: false, error: "Referral code not found" });
  }

  return NextResponse.json({
    valid: true,
    referrerName: referrer.name,
  });
}
