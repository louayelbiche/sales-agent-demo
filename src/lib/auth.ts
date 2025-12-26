import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import prisma from "./prisma";
import type { SessionUser } from "@/types";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_DAYS = 7;
const MAGIC_TOKEN_DURATION_HOURS = 24;

export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

export async function createMagicToken(email: string): Promise<string> {
  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }

  // Create magic token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + MAGIC_TOKEN_DURATION_HOURS * 60 * 60 * 1000);

  await prisma.magicToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  return token;
}

export async function verifyMagicToken(token: string): Promise<string | null> {
  const magicToken = await prisma.magicToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!magicToken) {
    return null;
  }

  // Check if expired
  if (magicToken.expiresAt < new Date()) {
    await prisma.magicToken.delete({ where: { id: magicToken.id } });
    return null;
  }

  // Check if already used
  if (magicToken.usedAt) {
    return null;
  }

  // Mark as used
  await prisma.magicToken.update({
    where: { id: magicToken.id },
    data: { usedAt: new Date() },
  });

  // Create session
  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId: magicToken.userId,
      expiresAt,
    },
  });

  return sessionToken;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({ where: { sessionToken } });
  }
}

export function setSessionCookie(sessionToken: string): void {
  // This needs to be called in a route handler context
  // The cookie will be set via the response
}

export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  path: "/",
};
