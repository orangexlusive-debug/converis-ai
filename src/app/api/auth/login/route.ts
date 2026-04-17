import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export const runtime = "nodejs";

const USERS: Record<
  string,
  { password: string; name: string }
> = {
  "manuel.lara@converis.ai": {
    password: "Converis2006!",
    name: "Manuel Lara",
  },
  "demo@converis.ai": {
    password: "Demo2024",
    name: "Demo User",
  },
};

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET ?? "converis-dev-jwt-secret-change-in-production";
  return new TextEncoder().encode(s);
}

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
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

  const user = USERS[email];
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await new SignJWT({
    email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  return NextResponse.json({
    token,
    user: { email, name: user.name },
  });
}
