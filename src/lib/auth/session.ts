import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyAuthToken } from "@/lib/auth/jwt";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  active: boolean;
};

export function serializeUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    active: user.active,
  };
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { sub } = await verifyAuthToken(token);
    if (!sub) return null;
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user || !user.active) return null;
    return serializeUser(user);
  } catch {
    return null;
  }
}

export function authCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
