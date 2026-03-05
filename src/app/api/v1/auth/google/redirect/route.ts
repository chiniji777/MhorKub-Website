import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * GET /api/v1/auth/google/redirect
 *
 * Initiates Google OAuth 2.0 authorization code flow.
 * Used by the Electron desktop app (where GIS prompt() doesn't work).
 * Redirects the user to Google's consent screen.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mhorkub.com";
  const redirectUri = `${baseUrl}/api/v1/auth/google/callback`;

  const googleAuthUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth"
  );
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("access_type", "online");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(googleAuthUrl.toString());
}
