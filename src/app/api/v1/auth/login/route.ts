import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signCustomerToken, signRefreshToken } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const [customer] = await db.select().from(customers).where(eq(customers.email, email));

    if (!customer || !customer.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check email verification
    if (!customer.emailVerified) {
      return NextResponse.json(
        { error: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
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
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
