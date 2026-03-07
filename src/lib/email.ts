import crypto from "crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mhorkub.com";

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  customerName: string
) {
  if (!RESEND_API_KEY) {
    throw new Error("Email service not configured (RESEND_API_KEY missing)");
  }

  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const html = buildVerificationEmailHtml(customerName, verifyUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "MhorKub <noreply@mhorkub.com>",
      to,
      subject: "ยืนยันอีเมลของคุณ — MhorKub",
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
  }
}

function buildVerificationEmailHtml(name: string, verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4, #0891b2);padding:32px 32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">MhorKub</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">ยืนยันอีเมลของคุณ</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#18181b;font-size:16px;">สวัสดีคุณ ${name} 👋</p>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:14px;line-height:1.6;">
                ขอบคุณที่สมัครสมาชิก MhorKub! กรุณากดปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" style="display:inline-block;background-color:#06b6d4;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                      ยืนยันอีเมล
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.5;">
                ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง<br>
                หากคุณไม่ได้สมัครสมาชิก สามารถเพิกเฉยอีเมลนี้ได้
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background-color:#f9fafb;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} MhorKub. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
