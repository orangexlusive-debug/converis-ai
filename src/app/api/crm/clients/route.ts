import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ClientStatus, Prisma } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry");
  const status = searchParams.get("status") as ClientStatus | null;
  const manager = searchParams.get("manager");
  const q = searchParams.get("q")?.trim().toLowerCase();

  const where: Prisma.ClientWhereInput = {};
  if (industry) where.industry = industry;
  if (status && Object.values(ClientStatus).includes(status)) where.status = status;
  if (manager) where.assignedToId = manager;
  if (q) where.companyName = { contains: q };

  const clients = await prisma.client.findMany({
    where,
    orderBy: { companyName: "asc" },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      _count: { select: { contacts: true, contracts: true } },
    },
  });

  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  let body: {
    companyName?: string;
    industry?: string;
    contractValue?: number;
    startDate?: string | null;
    status?: ClientStatus;
    assignedToId?: string | null;
    healthScore?: number;
    notes?: string;
    address?: string;
    billingEmail?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const companyName = String(body.companyName ?? "").trim();
  if (!companyName) {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      companyName,
      industry: String(body.industry ?? ""),
      contractValue: Number(body.contractValue ?? 0),
      startDate: body.startDate ? new Date(body.startDate) : null,
      status: body.status && Object.values(ClientStatus).includes(body.status) ? body.status : "ACTIVE",
      assignedToId: body.assignedToId ?? null,
      healthScore: body.healthScore ?? 80,
      notes: String(body.notes ?? ""),
      address: String(body.address ?? ""),
      billingEmail: String(body.billingEmail ?? ""),
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "client",
      title: "Client created",
      description: companyName,
      clientId: client.id,
      actorId: auth.session.id,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
