import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secret } = body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
