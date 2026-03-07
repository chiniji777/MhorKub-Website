import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, emailVerificationTokens } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Always return same message to prevent email enumeration
    const successMessage = "หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์ยืนยันไปให้";

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    if (!customer || customer.emailVerified) {
      return NextResponse.json({ message: successMessage });
    }

    // Rate limit: check last token created time (2 min cooldown)
    const [lastToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.customerId, customer.id),
          isNull(emailVerificationTokens.usedAt)
        )
      )
      .orderBy(desc(emailVerificationTokens.createdAt))
      .limit(1);

    if (lastToken) {
      const cooldownMs = 2 * 60 * 1000; // 2 minutes
      const timeSinceLastToken = Date.now() - lastToken.createdAt.getTime();
      if (timeSinceLastToken < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - timeSinceLastToken) / 1000);
        return NextResponse.json(
          { error: `กรุณารอ ${waitSeconds} วินาทีก่อนขอลิงก์ใหม่` },
          { status: 429 }
        );
      }
    }

    // Generate new token and send
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(emailVerificationTokens).values({
      customerId: customer.id,
      token,
      expiresAt,
    });

    sendVerificationEmail(customer.email, token, customer.name).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    return NextResponse.json({ message: successMessage });
  } catch {
    return NextResponse.json(
      { error: "ส่งอีเมลยืนยันไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
