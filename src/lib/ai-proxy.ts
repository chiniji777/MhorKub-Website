import { db } from "@/db";
import { aiUsageLogs, customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const MARKUP_MULTIPLIER = 3;

// Approximate pricing per 1M tokens in satang (THB cents)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 250, output: 1000 },
  "gpt-4o-mini": { input: 15, output: 60 },
  "gpt-4-turbo": { input: 1000, output: 3000 },
  "gpt-3.5-turbo": { input: 50, output: 150 },
};

function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): { costSatang: number; chargedSatang: number } {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["gpt-4o-mini"];
  const costSatang = Math.ceil(
    (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000
  );
  const chargedSatang = costSatang * MARKUP_MULTIPLIER;
  return { costSatang, chargedSatang };
}

export async function proxyAIChat(
  customerId: number,
  messages: Array<{ role: string; content: string }>,
  model: string = "gpt-4o-mini"
): Promise<{
  success: boolean;
  data?: { content: string; usage: { promptTokens: number; completionTokens: number; chargedSatang: number } };
  error?: string;
}> {
  // Check customer AI credit balance
  const [customer] = await db
    .select({ creditBalance: customers.creditBalance })
    .from(customers)
    .where(eq(customers.id, customerId));

  if (!customer || customer.creditBalance <= 0) {
    return { success: false, error: "Insufficient AI credits" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error?.message || "AI API error" };
    }

    const promptTokens = result.usage?.prompt_tokens || 0;
    const completionTokens = result.usage?.completion_tokens || 0;
    const { costSatang, chargedSatang } = calculateCost(model, promptTokens, completionTokens);

    // Deduct from balance and log usage
    await db
      .update(customers)
      .set({ creditBalance: sql`${customers.creditBalance} - ${chargedSatang}` })
      .where(eq(customers.id, customerId));

    await db.insert(aiUsageLogs).values({
      customerId,
      provider: "openai",
      model,
      promptTokens,
      completionTokens,
      costSatang,
      chargedSatang,
    });

    return {
      success: true,
      data: {
        content: result.choices?.[0]?.message?.content || "",
        usage: { promptTokens, completionTokens, chargedSatang },
      },
    };
  } catch {
    return { success: false, error: "Failed to connect to AI API" };
  }
}
