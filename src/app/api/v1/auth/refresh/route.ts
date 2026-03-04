import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerToken, signCustomerToken, signRefreshToken } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token required" }, { status: 400 });
    }

    const { customerId } = await verifyCustomerToken(refreshToken);

    const accessToken = await signCustomerToken(customerId);
    const newRefreshToken = await signRefreshToken(customerId);

    return NextResponse.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
