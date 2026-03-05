import type { SlipOKData } from "./slipok";

const PROMPTPAY_PHONE = process.env.PROMPTPAY_PHONE || "";

interface ValidationResult {
  valid: boolean;
  failReason?: string;
}

// ─── Normalize Thai phone number ───────────────────────────────
function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-()]/g, "");
  if (p.startsWith("+66")) p = "0" + p.substring(3);
  if (p.startsWith("66") && p.length === 11) p = "0" + p.substring(2);
  return p;
}

// ─── 1. Validate Slip Timestamp ────────────────────────────────
// Slip must be created AFTER the order/topup was created
// Allow 5 min tolerance for clock skew between bank and server
export function validateSlipTimestamp(
  transDate: string,
  transTime: string,
  orderCreatedAt: Date
): ValidationResult {
  try {
    if (!transDate || !transTime) {
      return {
        valid: false,
        failReason: `ไม่มีข้อมูลเวลาสลิป (transDate=${transDate}, transTime=${transTime})`,
      };
    }

    // Parse date — handle "2024-01-15" or "20240115"
    const dateClean = transDate.replace(/[^0-9]/g, "");
    const year = dateClean.substring(0, 4);
    const month = dateClean.substring(4, 6);
    const day = dateClean.substring(6, 8);

    // Parse time — handle "14:30:25" or "143025"
    const timeClean = transTime.replace(/[^0-9]/g, "");
    const hour = timeClean.substring(0, 2);
    const min = timeClean.substring(2, 4);
    const sec = timeClean.substring(4, 6) || "00";

    // SlipOK returns Thai timezone (UTC+7)
    const slipDateTime = new Date(
      `${year}-${month}-${day}T${hour}:${min}:${sec}+07:00`
    );

    if (isNaN(slipDateTime.getTime())) {
      return {
        valid: false,
        failReason: `แปลงเวลาสลิปไม่ได้: ${transDate} ${transTime}`,
      };
    }

    // Slip must be created AFTER order (with 5 min tolerance)
    const toleranceMs = 5 * 60 * 1000;
    const minAllowedTime = new Date(orderCreatedAt.getTime() - toleranceMs);

    if (slipDateTime < minAllowedTime) {
      const diffMin = Math.round(
        (minAllowedTime.getTime() - slipDateTime.getTime()) / 60000
      );
      return {
        valid: false,
        failReason: `สลิปเก่ากว่ารายการ ${diffMin} นาที — เวลาสลิป: ${transDate} ${transTime}`,
      };
    }

    // Slip should not be too far in the future (max 10 min)
    const now = new Date();
    const maxFutureMs = 10 * 60 * 1000;
    if (slipDateTime.getTime() > now.getTime() + maxFutureMs) {
      return {
        valid: false,
        failReason: `เวลาสลิปอยู่ในอนาคต: ${transDate} ${transTime}`,
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      failReason: `ตรวจสอบเวลาสลิปล้มเหลว: ${transDate} ${transTime}`,
    };
  }
}

// ─── 2. Validate Receiver PromptPay Account ────────────────────
// Receiver proxy/account must match our PromptPay phone number
export function validateSlipReceiver(
  receiver: SlipOKData["receiver"]
): ValidationResult {
  if (!PROMPTPAY_PHONE) {
    console.warn(
      "[slip-validator] PROMPTPAY_PHONE not set, skipping receiver validation"
    );
    return { valid: true };
  }

  const expectedPhone = normalizePhone(PROMPTPAY_PHONE);
  const last4 = expectedPhone.slice(-4);

  // Check receiver proxy (PromptPay number)
  if (receiver.proxy?.value) {
    const proxyNorm = normalizePhone(receiver.proxy.value);
    if (proxyNorm === expectedPhone || proxyNorm.endsWith(last4)) {
      return { valid: true };
    }
  }

  // Check receiver account
  if (receiver.account?.value) {
    const accountNorm = normalizePhone(receiver.account.value);
    if (accountNorm === expectedPhone || accountNorm.endsWith(last4)) {
      return { valid: true };
    }
  }

  // Fallback: check displayName contains last 4 digits (some banks show partial)
  if (receiver.displayName) {
    const cleaned = receiver.displayName.replace(/[\s\-*xX]/g, "");
    if (cleaned.includes(last4)) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    failReason: `บัญชีรับโอนไม่ตรง — ผู้รับ: ${receiver.displayName || "ไม่ทราบ"} (proxy: ${receiver.proxy?.value || "N/A"}, account: ${receiver.account?.value || "N/A"})`,
  };
}

// ─── 3. Validate Amount ────────────────────────────────────────
export function validateSlipAmount(
  slipAmount: number,
  expectedAmountSatang: number
): ValidationResult {
  const expectedThb = expectedAmountSatang / 100;
  if (Math.abs(slipAmount - expectedThb) > 0.5) {
    return {
      valid: false,
      failReason: `ยอดเงินไม่ตรง — สลิป: ${slipAmount} บาท, คาดหวัง: ${expectedThb} บาท`,
    };
  }
  return { valid: true };
}

// ─── Combined Validator ────────────────────────────────────────
// Returns the FIRST failed check, or { valid: true } if all pass
export function validateSlipForPayment(params: {
  slipData: SlipOKData;
  expectedAmountSatang: number;
  orderCreatedAt: Date;
}): ValidationResult {
  const { slipData, expectedAmountSatang, orderCreatedAt } = params;

  // 1. Timestamp check — slip must be after order creation
  const timeCheck = validateSlipTimestamp(
    slipData.transDate,
    slipData.transTime,
    orderCreatedAt
  );
  if (!timeCheck.valid) {
    console.warn("[slip-validator] Timestamp failed:", timeCheck.failReason);
    return timeCheck;
  }

  // 2. Receiver check — must be our PromptPay account
  const receiverCheck = validateSlipReceiver(slipData.receiver);
  if (!receiverCheck.valid) {
    console.warn("[slip-validator] Receiver failed:", receiverCheck.failReason);
    return receiverCheck;
  }

  // 3. Amount check
  const amountCheck = validateSlipAmount(slipData.amount, expectedAmountSatang);
  if (!amountCheck.valid) {
    console.warn("[slip-validator] Amount failed:", amountCheck.failReason);
    return amountCheck;
  }

  return { valid: true };
}
