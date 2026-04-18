import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      active: true,
    },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const enriched = await Promise.all(
    users.map(async (u) => {
      const [clientsAssigned, demosThisMonth, rev] = await Promise.all([
        prisma.client.count({ where: { assignedToId: u.id } }),
        prisma.demoRequest.count({ where: { assignedToId: u.id, createdAt: { gte: monthStart } } }),
        prisma.client.aggregate({
          where: { assignedToId: u.id },
          _sum: { contractValue: true },
        }),
      ]);
      return {
        ...u,
        createdAt: u.createdAt.toISOString(),
        clientsAssigned,
        demosThisMonth,
        revenueManaged: rev._sum.contractValue ?? 0,
      };
    })
  );

  return NextResponse.json({ team: enriched });
}

export async function POST(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  let body: { email?: string; name?: string; password?: string; role?: Role };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !name || !password) {
    return NextResponse.json({ error: "email, name, password required" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  const hash = await bcrypt.hash(password, 12);
  const role = body.role === Role.ADMIN ? Role.ADMIN : Role.USER;

  const user = await prisma.user.create({
    data: { email, name, password: hash, role, active: true },
    select: { id: true, email: true, name: true, role: true, createdAt: true, active: true },
  });

  return NextResponse.json({ user: { ...user, createdAt: user.createdAt.toISOString() } }, { status: 201 });
}
