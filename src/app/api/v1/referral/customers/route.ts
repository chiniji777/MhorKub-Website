import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { customers, orders, plans, referralTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  // Get referred customers
  const referredCustomers = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.referredBy, customer.id))
    .orderBy(desc(customers.createdAt));

  // Get all referral transactions with order + plan details
  const transactions = await db
    .select({
      orderId: referralTransactions.orderId,
      cashbackAmount: referralTransactions.amountThb,
      orderCustomerId: orders.customerId,
      orderAmount: orders.amountThb,
      orderPaidAt: orders.paidAt,
      planName: plans.name,
    })
    .from(referralTransactions)
    .innerJoin(orders, eq(referralTransactions.orderId, orders.id))
    .innerJoin(plans, eq(orders.planId, plans.id))
    .where(eq(referralTransactions.referrerId, customer.id))
    .orderBy(desc(orders.paidAt));

  // Group transactions by customer
  const result = referredCustomers.map((c) => ({
    name: c.name,
    email: c.email,
    createdAt: c.createdAt,
    orders: transactions
      .filter((t) => t.orderCustomerId === c.id)
      .map((t) => ({
        planName: t.planName,
        amountThb: t.orderAmount,
        cashback: t.cashbackAmount,
        paidAt: t.orderPaidAt,
      })),
  }));

  return NextResponse.json({ customers: result });
}
