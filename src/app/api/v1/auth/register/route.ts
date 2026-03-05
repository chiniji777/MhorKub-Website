import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signCustomerToken, signRefreshToken, generateReferralCode } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, referralCode } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check existing
    const [existing] = await db.select().from(customers).where(eq(customers.email, email));
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Resolve referrer
    let referredBy: number | null = null;
    if (referralCode) {
      const [referrer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.referralCode, referralCode));
      if (referrer) referredBy = referrer.id;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const myReferralCode = generateReferralCode();

    const [customer] = await db
      .insert(customers)
      .values({
        email,
        passwordHash,
        name,
        phone: phone || null,
        referralCode: myReferralCode,
        referredBy,
      })
      .returning();

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
    }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
