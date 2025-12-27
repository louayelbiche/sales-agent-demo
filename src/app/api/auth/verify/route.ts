import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/auth/error?reason=missing_token", appUrl));
    }

    const sessionToken = await verifyMagicToken(token);

    if (!sessionToken) {
      return NextResponse.redirect(new URL("/auth/error?reason=invalid_token", appUrl));
    }

    // Create response with redirect to dashboard
    const response = NextResponse.redirect(new URL("/dashboard", appUrl));

    // Set session cookie
    response.cookies.set(SESSION_COOKIE_OPTIONS.name, sessionToken, {
      httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
      secure: SESSION_COOKIE_OPTIONS.secure,
      sameSite: SESSION_COOKIE_OPTIONS.sameSite,
      maxAge: SESSION_COOKIE_OPTIONS.maxAge,
      path: SESSION_COOKIE_OPTIONS.path,
    });

    return response;
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.redirect(new URL("/auth/error?reason=server_error", appUrl));
  }
}
