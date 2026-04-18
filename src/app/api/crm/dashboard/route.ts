import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ClientStatus, ContractStatus, DemoRequestStatus, PipelineStage } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [
    totalDemos,
    newDemosWeek,
    activeClients,
    clientsAll,
    invoicesYtd,
    invoices12m,
    allDealsForPipeline,
    contracts,
    recentDemos,
    recentClients,
    recentActivities,
    followUps,
  ] = await Promise.all([
    prisma.demoRequest.count(),
    prisma.demoRequest.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.client.count({ where: { status: ClientStatus.ACTIVE } }),
    prisma.client.findMany({ select: { status: true } }),
    prisma.invoice.aggregate({ _sum: { amount: true } }),
    prisma.invoice.findMany({
      where: { issuedAt: { gte: yearAgo } },
      select: { amount: true, issuedAt: true },
    }),
    prisma.deal.findMany(),
    prisma.contract.findMany({
      where: { status: ContractStatus.ACTIVE },
      include: { client: { select: { companyName: true } } },
    }),
    prisma.demoRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { assignedTo: { select: { name: true } } },
    }),
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, companyName: true, industry: true, createdAt: true },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.demoRequest.findMany({
      where: { status: { in: [DemoRequestStatus.NEW, DemoRequestStatus.CONTACTED, DemoRequestStatus.SCHEDULED] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, company: true, name: true, email: true, status: true, updatedAt: true },
    }),
  ]);

  const churned = clientsAll.filter((c) => c.status === ClientStatus.CHURNED).length;
  const churnRate = clientsAll.length ? Math.round((churned / clientsAll.length) * 1000) / 10 : 0;

  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }
  for (const inv of invoices12m) {
    const d = new Date(inv.issuedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + inv.amount);
    }
  }
  const revenueByMonth = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  const pipelineValue = allDealsForPipeline
    .filter(
      (d) => d.stage !== PipelineStage.CLOSED_LOST && d.stage !== PipelineStage.CLOSED_WON
    )
    .reduce((s, d) => s + d.estimatedValue, 0);

  const annualRevenue = contracts
    .filter((c) => c.status === ContractStatus.ACTIVE)
    .reduce((s, c) => s + c.value, 0);

  const monthlyRevenue = invoicesYtd._sum.amount ?? 0;

  const won = await prisma.deal.count({ where: { stage: PipelineStage.CLOSED_WON } });
  const conversionRate =
    totalDemos > 0 ? Math.round((won / totalDemos) * 1000) / 10 : 0;

  const responded = await prisma.demoRequest.count({
    where: { status: { not: DemoRequestStatus.NEW } },
  });
  const avgResponseHrs = totalDemos > 0 ? Math.max(4, Math.round((48 * responded) / totalDemos)) : 0;

  const funnelMap = new Map<string, { count: number; value: number }>();
  for (const st of Object.values(PipelineStage)) {
    funnelMap.set(st, { count: 0, value: 0 });
  }
  for (const d of allDealsForPipeline) {
    const cur = funnelMap.get(d.stage) ?? { count: 0, value: 0 };
    funnelMap.set(d.stage, {
      count: cur.count + 1,
      value: cur.value + d.estimatedValue,
    });
  }

  const topClients = await prisma.client.findMany({
    where: { status: ClientStatus.ACTIVE },
    orderBy: { contractValue: "desc" },
    take: 6,
    select: {
      id: true,
      companyName: true,
      industry: true,
      contractValue: true,
      healthScore: true,
    },
  });

  return NextResponse.json({
    kpis: {
      totalDemoRequests: totalDemos,
      activeClients,
      monthlyRevenue,
      annualRevenue,
      pipelineValue,
      churnRate,
      newDemosThisWeek: newDemosWeek,
      conversionRate,
      avgResponseTimeHours: avgResponseHrs,
    },
    revenueByMonth,
    funnel: Array.from(funnelMap.entries()).map(([stage, v]) => ({ stage, ...v })),
    recentDemos,
    recentClients,
    recentActivities,
    followUps,
    topClients,
    expiringContracts: contracts
      .map((c) => {
        const days = Math.ceil((c.endDate.getTime() - now.getTime()) / 86400000);
        return {
          id: c.id,
          clientName: c.client.companyName,
          endDate: c.endDate.toISOString(),
          days,
          value: c.value,
        };
      })
      .filter((c) => c.days <= 120)
      .sort((a, b) => a.days - b.days)
      .slice(0, 8),
  });
}
