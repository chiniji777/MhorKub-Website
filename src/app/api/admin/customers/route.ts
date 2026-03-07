import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import {
  customers,
  licenses,
  orders,
  deviceActivations,
  emailVerificationTokens,
  notifications,
  aiUsageLogs,
  aiCreditTopups,
  withdrawalRequests,
  referralTransactions,
} from "@/db/schema";
import { desc, ilike, sql, eq, or, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const whereClause = search
      ? or(
          ilike(customers.email, `%${search}%`),
          ilike(customers.name, `%${search}%`)
        )
      : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause);

    const data = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      customers: data,
      total: countResult.count,
      page,
      totalPages: Math.ceil(countResult.count / limit),
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, email, phone, emailVerified } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Check email uniqueness if changing email
    if (email) {
      const [existing] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.email, email))
        .limit(1);
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
      }
    }

    const [updated] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();

    return NextResponse.json({ customer: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
    }

    // Delete from all related tables first (FK order)
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.customerId, id));
    await db.delete(notifications).where(eq(notifications.customerId, id));
    await db.delete(deviceActivations).where(eq(deviceActivations.customerId, id));
    await db.delete(aiUsageLogs).where(eq(aiUsageLogs.customerId, id));
    await db.delete(aiCreditTopups).where(eq(aiCreditTopups.customerId, id));
    await db.delete(withdrawalRequests).where(eq(withdrawalRequests.customerId, id));
    await db.delete(referralTransactions).where(eq(referralTransactions.referrerId, id));
    await db.delete(licenses).where(eq(licenses.customerId, id));
    await db.delete(orders).where(eq(orders.customerId, id));
    await db.delete(customers).where(eq(customers.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
