import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, emailVerificationTokens } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { signCustomerToken, signRefreshToken } from "@/lib/customer-auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find token
    const [record] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          isNull(emailVerificationTokens.usedAt)
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { error: "ลิงก์ยืนยันไม่ถูกต้องหรือถูกใช้งานแล้ว" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { error: "ลิงก์ยืนยันหมดอายุแล้ว กรุณาขอลิงก์ใหม่" },
        { status: 400 }
      );
    }

    // Mark token as used
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, record.id));

    // Mark customer as verified
    await db
      .update(customers)
      .set({ emailVerified: true })
      .where(eq(customers.id, record.customerId));

    // Get customer data
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, record.customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Issue JWT tokens
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
  } catch (err) {
    console.error("Email verification error:", err);
    return NextResponse.json(
      { error: "ยืนยันอีเมลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
