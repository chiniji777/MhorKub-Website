import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { deviceActivations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  const devices = await db
    .select()
    .from(deviceActivations)
    .where(eq(deviceActivations.customerId, auth.customer.id));

  return NextResponse.json(devices);
}

export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;
  const { customer } = auth;

  try {
    const { macAddress, deviceName } = await req.json();

    if (!macAddress) {
      return NextResponse.json({ error: "MAC address is required" }, { status: 400 });
    }

    // Check if device already registered
    const [existing] = await db
      .select()
      .from(deviceActivations)
      .where(
        and(
          eq(deviceActivations.customerId, customer.id),
          eq(deviceActivations.macAddress, macAddress)
        )
      );

    if (existing) {
      // Update last seen
      await db
        .update(deviceActivations)
        .set({ lastSeenAt: new Date(), deviceName: deviceName || existing.deviceName })
        .where(eq(deviceActivations.id, existing.id));

      return NextResponse.json({ message: "Device updated", device: existing });
    }

    const [device] = await db
      .insert(deviceActivations)
      .values({
        customerId: customer.id,
        macAddress,
        deviceName: deviceName || null,
      })
      .returning();

    return NextResponse.json({ message: "Device registered", device }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
  }
}
