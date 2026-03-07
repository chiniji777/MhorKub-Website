import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { customers, emailVerificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateReferralCode } from "@/lib/customer-auth";
import { createNotification } from "@/lib/notifications";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, referralCode } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "กรุณากรอกอีเมล รหัสผ่าน และชื่อให้ครบ" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
    }

    // Check existing
    const [existing] = await db.select().from(customers).where(eq(customers.email, email));
    if (existing) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบแทน" }, { status: 409 });
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

    // Notify referrer about new signup
    if (referredBy) {
      createNotification(
        referredBy,
        "referral_signup",
        "มีคนใช้รหัสแนะนำของคุณ!",
        `${customer.name} สมัครสมาชิกผ่านรหัสแนะนำของคุณ เมื่อเขาซื้อแพ็กเกจ คุณจะได้รับเงินคืน 10%`
      ).catch(() => {});
    }

    // Generate verification token and send email
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(emailVerificationTokens).values({
      customerId: customer.id,
      token,
      expiresAt,
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(customer.email, token, customer.name).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    return NextResponse.json({
      requiresVerification: true,
      message: "กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัครสมาชิก",
    }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    const message = err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
