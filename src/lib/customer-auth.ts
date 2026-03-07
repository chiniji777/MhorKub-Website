import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

if (!process.env.CUSTOMER_JWT_SECRET) {
  throw new Error("CUSTOMER_JWT_SECRET environment variable is required");
}
const secret = new TextEncoder().encode(process.env.CUSTOMER_JWT_SECRET);

export async function signCustomerToken(customerId: number) {
  return new SignJWT({ sub: String(customerId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function signRefreshToken(customerId: number) {
  return new SignJWT({ sub: String(customerId), type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret);
}

export async function verifyCustomerToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return { customerId: Number(payload.sub) };
}

export async function requireCustomer(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const token = authHeader.slice(7);
    const { customerId } = await verifyCustomerToken(token);

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) {
      return { error: NextResponse.json({ error: "Customer not found" }, { status: 401 }) };
    }

    return { customer };
  } catch {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MHK-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
