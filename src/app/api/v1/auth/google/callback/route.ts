import { NextRequest } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  signCustomerToken,
  signRefreshToken,
  generateReferralCode,
} from "@/lib/customer-auth";
import { createNotification } from "@/lib/notifications";

/**
 * GET /api/v1/auth/google/callback
 *
 * Handles the OAuth 2.0 redirect from Google.
 * Exchanges the authorization code for tokens, creates/finds customer,
 * and returns an HTML page that stores tokens in localStorage.
 *
 * The Electron desktop app's BrowserWindow storage scanning (Strategy 2)
 * will detect the JWT tokens in localStorage and complete the auth flow.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new Response(errorPage("Google เข้าสู่ระบบถูกยกเลิก"), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!code) {
    return new Response(errorPage("ไม่ได้รับ authorization code จาก Google"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mhorkub.com";
    const redirectUri = `${baseUrl}/api/v1/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.id_token) {
      console.error("[Google Callback] Token exchange failed:", tokenData);
      return new Response(
        errorPage("ไม่สามารถยืนยันตัวตนกับ Google ได้"),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // Verify the id_token
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`
    );
    const googleData = await verifyRes.json();

    if (!verifyRes.ok || !googleData.email) {
      return new Response(errorPage("Google token ไม่ถูกต้อง"), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const { email, name, sub: googleId } = googleData;

    // Find or create customer (same logic as POST /api/v1/auth/google)
    let [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email));

    if (!customer) {
      [customer] = await db
        .insert(customers)
        .values({
          email,
          name: name || email.split("@")[0],
          googleId,
          emailVerified: true,
          referralCode: generateReferralCode(),
        })
        .returning();
    } else if (!customer.googleId) {
      // Link Google account to existing customer + auto-verify
      await db
        .update(customers)
        .set({ googleId, emailVerified: true })
        .where(eq(customers.id, customer.id));
    }

    const accessToken = await signCustomerToken(customer.id);
    const refreshToken = await signRefreshToken(customer.id);

    // Return HTML page that stores tokens in localStorage
    // Electron's BrowserWindow Strategy 2 (storage scanning) picks these up
    const customerData = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      referralCode: customer.referralCode,
    };

    return new Response(
      successPage(accessToken, refreshToken, customerData),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (err) {
    console.error("[Google Callback] Error:", err);
    return new Response(errorPage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ"), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function successPage(
  accessToken: string,
  refreshToken: string,
  customer: { id: number; email: string; name: string; referralCode: string | null }
): string {
  // Safe: tokens are base64url-encoded JWTs, customer data is from our DB
  const customerJson = JSON.stringify(customer).replace(/</g, "\\u003c");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>MhorKub — เข้าสู่ระบบสำเร็จ</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:16px;padding:40px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:380px;width:90%}
.icon{width:64px;height:64px;background:#06B6D4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;animation:pop .4s ease}
@keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
.icon svg{width:32px;height:32px}
h1{font-size:20px;font-weight:700;color:#1e293b;margin-bottom:6px}
.sub{font-size:14px;color:#64748b;margin-bottom:24px}
.info{font-size:13px;color:#94a3b8}
</style></head><body>
<div class="card">
  <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
  <h1>เข้าสู่ระบบสำเร็จ!</h1>
  <p class="sub">กำลังกลับสู่แอป MhorKub...</p>
  <p class="info">หน้าต่างนี้จะปิดอัตโนมัติ</p>
</div>
<script>
localStorage.setItem('accessToken',${JSON.stringify(accessToken)});
localStorage.setItem('refreshToken',${JSON.stringify(refreshToken)});
localStorage.setItem('customer',${JSON.stringify(customerJson)});
// Let Electron detect the tokens and close the window (~800ms).
// This 8s delay is only a safety net in case Electron doesn't close it.
setTimeout(function(){ try { window.close(); } catch(e){} }, 8000);
</script>
</body></html>`;
}

function errorPage(message: string): string {
  const safeMessage = message.replace(/[<>&"']/g, "");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>MhorKub — เข้าสู่ระบบ</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:16px;padding:40px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:380px;width:90%}
.icon{width:64px;height:64px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.icon svg{width:32px;height:32px}
h1{font-size:20px;font-weight:700;color:#1e293b;margin-bottom:6px}
.sub{font-size:14px;color:#64748b;margin-bottom:24px}
.btn{display:inline-block;background:#06B6D4;color:#fff;border:none;padding:10px 28px;font-size:14px;font-weight:600;border-radius:8px;cursor:pointer;text-decoration:none}
.btn:hover{background:#0891b2}
</style></head><body>
<div class="card">
  <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
  <h1>เข้าสู่ระบบไม่สำเร็จ</h1>
  <p class="sub">${safeMessage}</p>
  <a class="btn" href="/login">ลองใหม่</a>
</div>
</body></html>`;
}
