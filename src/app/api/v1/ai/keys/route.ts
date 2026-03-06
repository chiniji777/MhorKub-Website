import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/db";
import { licenses } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

/**
 * GET /api/v1/ai/keys
 *
 * Returns AI provider API keys for rent-AI mode.
 * Requires: valid JWT + active license.
 *
 * Keys are stored in Vercel environment variables:
 *   RENT_OPENAI_KEY   — OpenAI API key (required)
 *   RENT_GEMINI_KEY   — Google Gemini API key (optional)
 *   RENT_ANTHROPIC_KEY — Anthropic API key (optional)
 */
export async function GET(req: NextRequest) {
  // 1. Authenticate customer
  const auth = await requireCustomer(req);
  if (auth.error) return auth.error;

  // 2. Check active license
  const [activeLicense] = await db
    .select({ id: licenses.id })
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId, auth.customer.id),
        eq(licenses.status, "active"),
        gte(licenses.expiresAt, new Date())
      )
    )
    .orderBy(desc(licenses.expiresAt))
    .limit(1);

  if (!activeLicense) {
    return NextResponse.json(
      { error: "ต้องมี license ที่ active จึงจะใช้ Rent AI ได้" },
      { status: 403 }
    );
  }

  // 3. Build keys object from env vars
  const keys: Record<string, string> = {};

  if (process.env.RENT_OPENAI_KEY) {
    keys.openai = process.env.RENT_OPENAI_KEY;
  }
  if (process.env.RENT_GEMINI_KEY) {
    keys.gemini = process.env.RENT_GEMINI_KEY;
  }
  if (process.env.RENT_ANTHROPIC_KEY) {
    keys.anthropic = process.env.RENT_ANTHROPIC_KEY;
  }

  if (Object.keys(keys).length === 0) {
    return NextResponse.json(
      { error: "ระบบ Rent AI ยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแล" },
      { status: 503 }
    );
  }

  return NextResponse.json({ keys });
}
