import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { signAuthToken } from "@/lib/auth/jwt";
import { authCookieOptions, serializeUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({ user: serializeUser(user) });
  res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
  return res;
}
