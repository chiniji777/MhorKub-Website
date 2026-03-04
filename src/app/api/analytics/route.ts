import { NextResponse } from "next/server";
import { db } from "@/db";
import { pageViews } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, referrer } = body;
    const userAgent = req.headers.get("user-agent") || null;

    await db.insert(pageViews).values({
      path: path || "/",
      referrer: referrer || null,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
