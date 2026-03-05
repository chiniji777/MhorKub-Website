import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const auth = await requireCustomer(req);
  if ("error" in auth) return auth.error;

  let ids: number[] | undefined;
  try {
    const body = await req.json();
    ids = body.ids;
  } catch {
    /* no body = mark all */
  }

  if (ids && ids.length > 0) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.customerId, auth.customer.id),
          inArray(notifications.id, ids)
        )
      );
  } else {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.customerId, auth.customer.id));
  }

  return NextResponse.json({ success: true });
}
