import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || "dev-secret-change-me"
);

interface SlipTokenPayload {
  id: number;
  type: "order" | "topup";
  customerId: number;
  amountThb: number;
}

export async function signSlipUploadToken(params: SlipTokenPayload) {
  return new SignJWT({
    sub: String(params.id),
    typ: params.type,
    cid: params.customerId,
    amt: params.amountThb,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

export async function verifySlipUploadToken(token: string): Promise<SlipTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return {
    id: Number(payload.sub),
    type: payload.typ as "order" | "topup",
    customerId: Number(payload.cid),
    amountThb: Number(payload.amt),
  };
}

export function generateSlipUploadUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://mhorkub.com";
  return `${base}/slip/${token}`;
}
