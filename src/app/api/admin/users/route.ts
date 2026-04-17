import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser, serializeUser, type SessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

async function requireAdmin(request: NextRequest): Promise<
  | { ok: true; session: SessionUser }
  | { ok: false; response: NextResponse }
> {
  const session = await getSessionUser(request);
  if (!session || session.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, session };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((u) => serializeUser(u)),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    active?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const role = body.role === "ADMIN" ? Role.ADMIN : Role.USER;
  const active = body.active !== false;

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "email, password, and name are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      role,
      active,
    },
  });

  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
}
