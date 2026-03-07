import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { customers, emailVerificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (customer.emailVerified) {
      return NextResponse.json({ error: "อีเมลนี้ยืนยันแล้ว" }, { status: 400 });
    }

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(emailVerificationTokens).values({
      customerId: customer.id,
      token,
      expiresAt,
    });

    await sendVerificationEmail(customer.email, token, customer.name);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to resend verification:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
