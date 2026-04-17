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

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
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

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const data: {
    email?: string;
    password?: string;
    name?: string;
    role?: Role;
    active?: boolean;
  } = {};

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email cannot be empty." }, { status: 400 });
    }
    data.email = email;
    const clash = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (clash) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
  }
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    data.name = name;
  }
  if (body.role !== undefined) {
    data.role = body.role === "ADMIN" ? Role.ADMIN : Role.USER;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.password !== undefined && body.password !== "") {
    data.password = await bcrypt.hash(String(body.password), 12);
  }

  if (existing.role === Role.ADMIN && data.active === false) {
    const otherAdmins = await prisma.user.count({
      where: { role: Role.ADMIN, active: true, NOT: { id } },
    });
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "Cannot deactivate the last active administrator." },
        { status: 400 }
      );
    }
  }

  if (existing.role === Role.ADMIN && data.role === Role.USER) {
    const otherAdmins = await prisma.user.count({
      where: { role: Role.ADMIN, active: true, NOT: { id } },
    });
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "Cannot remove the last administrator's role." },
        { status: 400 }
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json({ user: serializeUser(updated) });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  if (id === auth.session.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.role === Role.ADMIN) {
    const otherAdmins = await prisma.user.count({
      where: { role: Role.ADMIN, active: true, NOT: { id } },
    });
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "Cannot delete the last administrator." },
        { status: 400 }
      );
    }
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
