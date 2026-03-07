import { SignJWT, jwtVerify } from "jose";

if (!process.env.CUSTOMER_JWT_SECRET) {
  throw new Error("CUSTOMER_JWT_SECRET environment variable is required");
}
const secret = new TextEncoder().encode(process.env.CUSTOMER_JWT_SECRET);

export interface SlipUploadPayload {
  type: "topup" | "order";
  id: number;
  customerId: number;
  amount: number; // satang — for display on mobile page
}

/** Sign a short-lived token for mobile slip upload (1 hour) */
export async function signSlipUploadToken(payload: SlipUploadPayload) {
  return new SignJWT({
    purpose: "slip-upload",
    type: payload.type,
    id: payload.id,
    cid: payload.customerId,
    amt: payload.amount,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

/** Verify and decode a slip upload token */
export async function verifySlipUploadToken(token: string): Promise<SlipUploadPayload> {
  const { payload } = await jwtVerify(token, secret);

  if (payload.purpose !== "slip-upload") {
    throw new Error("Invalid token purpose");
  }

  return {
    type: payload.type as "topup" | "order",
    id: payload.id as number,
    customerId: payload.cid as number,
    amount: payload.amt as number,
  };
}

/** Build the full mobile upload URL */
export function buildSlipUploadUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://mhorkub.com";
  return `${base}/upload-slip?token=${token}`;
}
