import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signCustomerToken, signRefreshToken, generateReferralCode } from "@/lib/customer-auth";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const { idToken, referralCode } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Google ID token required" }, { status: 400 });
    }

    // Verify Google ID token
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    const googleData = await googleRes.json();

    if (!googleRes.ok || !googleData.email) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const { email, name, sub: googleId, picture } = googleData;

    // Find or create customer
    let [customer] = await db.select().from(customers).where(eq(customers.email, email));

    if (!customer) {
      // Resolve referrer
      let referredBy: number | null = null;
      if (referralCode) {
        const [referrer] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.referralCode, referralCode));
        if (referrer) referredBy = referrer.id;
      }

      [customer] = await db
        .insert(customers)
        .values({
          email,
          name: name || email.split("@")[0],
          googleId,
          referralCode: generateReferralCode(),
          referredBy,
        })
        .returning();
      // Notify referrer about new signup
      if (referredBy) {
        createNotification(
          referredBy,
          "referral_signup",
          "มีคนใช้รหัสแนะนำของคุณ!",
          `${customer.name} สมัครสมาชิกผ่านรหัสแนะนำของคุณ เมื่อเขาซื้อแพ็กเกจ คุณจะได้รับเงินคืน 10%`
        ).catch(() => {});
      }
    } else if (!customer.googleId) {
      // Link Google account
      await db
        .update(customers)
        .set({ googleId })
        .where(eq(customers.id, customer.id));
    }

    const accessToken = await signCustomerToken(customer.id);
    const refreshToken = await signRefreshToken(customer.id);

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        referralCode: customer.referralCode,
      },
      accessToken,
      refreshToken,
    });
  } catch {
    return NextResponse.json({ error: "Google login failed" }, { status: 500 });
  }
}
