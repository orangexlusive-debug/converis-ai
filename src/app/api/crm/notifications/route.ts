import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ClientStatus, ContractStatus, DemoRequestStatus } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 30);
  const stale = new Date(now);
  stale.setDate(stale.getDate() - 3);

  const [newDemos, expiring, lowHealth, staleDemos] = await Promise.all([
    prisma.demoRequest.findMany({
      where: { status: DemoRequestStatus.NEW, createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, company: true, createdAt: true },
    }),
    prisma.contract.findMany({
      where: { status: ContractStatus.ACTIVE, endDate: { lte: soon, gte: now } },
      include: { client: { select: { companyName: true } } },
      take: 10,
    }),
    prisma.client.findMany({
      where: { status: ClientStatus.ACTIVE, healthScore: { lt: 50 } },
      take: 10,
      select: { id: true, companyName: true, healthScore: true },
    }),
    prisma.demoRequest.findMany({
      where: { status: DemoRequestStatus.NEW, createdAt: { lt: stale } },
      take: 10,
      orderBy: { createdAt: "asc" },
      select: { id: true, company: true, createdAt: true },
    }),
  ]);

  const items = [
    ...newDemos.map((d) => ({
      id: `demo-${d.id}`,
      type: "demo" as const,
      title: "New demo request",
      subtitle: d.company,
      at: d.createdAt.toISOString(),
    })),
    ...expiring.map((c) => ({
      id: `contract-${c.id}`,
      type: "contract" as const,
      title: "Contract expiring soon",
      subtitle: `${c.client.companyName} · ${c.endDate.toLocaleDateString()}`,
      at: c.endDate.toISOString(),
    })),
    ...lowHealth.map((c) => ({
      id: `health-${c.id}`,
      type: "health" as const,
      title: "Client health drop",
      subtitle: `${c.companyName} · score ${c.healthScore}`,
      at: now.toISOString(),
    })),
    ...staleDemos.map((d) => ({
      id: `overdue-${d.id}`,
      type: "followup" as const,
      title: "Overdue follow-up",
      subtitle: d.company,
      at: d.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return NextResponse.json({ items: items.slice(0, 25) });
}
