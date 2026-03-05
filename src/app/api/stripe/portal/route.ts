import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mhorkub.com";

/**
 * POST /api/stripe/portal
 * Create a Stripe Customer Portal session for managing subscription.
 */
export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    if (!customer.stripeCustomerId) {
      return NextResponse.json(
        { error: "ยังไม่มีข้อมูลการชำระเงินผ่านบัตร" },
        { status: 400 }
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${SITE_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json({ error: "ไม่สามารถเปิดหน้าจัดการได้" }, { status: 500 });
  }
}
