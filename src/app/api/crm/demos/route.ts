import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DemoRequestStatus, Prisma } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvEscape(s: string) {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as DemoRequestStatus | null;
  const industry = searchParams.get("industry");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = searchParams.get("format");

  const where: Prisma.DemoRequestWhereInput = {};
  if (status && Object.values(DemoRequestStatus).includes(status)) {
    where.status = status;
  }
  if (industry) where.industry = industry;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const rows = await prisma.demoRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  if (format === "csv") {
    const header = [
      "Date",
      "Name",
      "Company",
      "Role",
      "Email",
      "Industry",
      "Message",
      "Status",
      "AssignedTo",
    ];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          csvEscape(r.createdAt.toISOString()),
          csvEscape(r.name),
          csvEscape(r.company),
          csvEscape(r.role),
          csvEscape(r.email),
          csvEscape(r.industry),
          csvEscape(r.message),
          csvEscape(r.status),
          csvEscape(r.assignedTo?.name ?? ""),
        ].join(",")
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="demo-requests.csv"',
      },
    });
  }

  const total = await prisma.demoRequest.count({ where });
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newWeek = await prisma.demoRequest.count({ where: { createdAt: { gte: weekAgo } } });
  const won = await prisma.deal.count({ where: { stage: "CLOSED_WON" } });
  const conversionRate = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;
  const responded = await prisma.demoRequest.count({ where: { status: { not: "NEW" } } });
  const avgResponseHrs = total > 0 ? Math.max(4, Math.round((48 * responded) / total)) : 0;

  return NextResponse.json({
    demos: rows,
    stats: {
      total,
      newThisWeek: newWeek,
      conversionRate,
      avgResponseTimeHours: avgResponseHrs,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  let body: {
    name?: string;
    company?: string;
    role?: string;
    email?: string;
    industry?: string;
    message?: string;
    status?: DemoRequestStatus;
    assignedToId?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const company = String(body.company ?? "").trim();
  const role = String(body.role ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const industry = String(body.industry ?? "").trim();
  if (!name || !company || !email) {
    return NextResponse.json({ error: "name, company, and email are required." }, { status: 400 });
  }

  const demo = await prisma.demoRequest.create({
    data: {
      name,
      company,
      role,
      email,
      industry,
      message: String(body.message ?? ""),
      status: body.status && Object.values(DemoRequestStatus).includes(body.status) ? body.status : "NEW",
      assignedToId: body.assignedToId ?? null,
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "demo",
      title: "Demo request created",
      description: `${company} · ${email}`,
      demoRequestId: demo.id,
      actorId: auth.session.id,
    },
  });

  return NextResponse.json({ demo }, { status: 201 });
}
