import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { randomBytes } from "crypto";

const PROMPTPAY_PHONE = process.env.PROMPTPAY_PHONE || "";

export function generatePromptpayRef(): string {
  return `MHK${Date.now()}${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function generatePromptpayQR(amountSatang: number): Promise<{
  qrDataUrl: string;
  promptpayRef: string;
  amountThb: number;
}> {
  const amountThb = amountSatang / 100;
  const payload = generatePayload(PROMPTPAY_PHONE, { amount: amountThb });
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  const promptpayRef = generatePromptpayRef();
  return { qrDataUrl, promptpayRef, amountThb };
}
