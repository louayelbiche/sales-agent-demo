import { NextResponse } from "next/server";
import { getSession, deleteSession, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: session,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get session" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await deleteSession();

    const response = NextResponse.json({
      success: true,
      message: "Logged out",
    });

    // Clear session cookie
    response.cookies.delete(SESSION_COOKIE_OPTIONS.name);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 }
    );
  }
}
