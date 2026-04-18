import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ClientStatus } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type P = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      contacts: true,
      deals: { orderBy: { updatedAt: "desc" } },
      contracts: { orderBy: { endDate: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let pmiDeals: unknown[] = [];
  try {
    pmiDeals = JSON.parse(client.pmiDealsJson || "[]") as unknown[];
  } catch {
    pmiDeals = [];
  }

  const { pmiDealsJson, ...rest } = client;
  void pmiDealsJson;
  return NextResponse.json({ client: { ...rest, pmiDeals } });
}

export async function PATCH(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.companyName !== undefined) data.companyName = String(body.companyName).trim();
  if (body.industry !== undefined) data.industry = String(body.industry);
  if (body.contractValue !== undefined) data.contractValue = Number(body.contractValue);
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(String(body.startDate)) : null;
  if (body.status !== undefined) {
    const st = String(body.status) as ClientStatus;
    if (!Object.values(ClientStatus).includes(st)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = st;
  }
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null;
  if (body.healthScore !== undefined) data.healthScore = Number(body.healthScore);
  if (body.notes !== undefined) data.notes = String(body.notes);
  if (body.address !== undefined) data.address = String(body.address);
  if (body.billingEmail !== undefined) data.billingEmail = String(body.billingEmail);
  if (body.pmiDealsJson !== undefined) {
    data.pmiDealsJson =
      typeof body.pmiDealsJson === "string"
        ? String(body.pmiDealsJson)
        : JSON.stringify(body.pmiDealsJson);
  }

  const client = await prisma.client.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ client });
}

export async function DELETE(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  await prisma.deal.updateMany({ where: { clientId: id }, data: { clientId: null } });
  await prisma.activity.deleteMany({ where: { clientId: id } });
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
