import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      year: true,
      dateFrom: true,
      dateTo: true,
      createdAt: true,
      summaryJson: true,
    },
  });

  return NextResponse.json({
    reports: reports.map((r) => ({
      ...r,
      dateFrom: r.dateFrom.toISOString(),
      dateTo: r.dateTo.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  let body: { dateFrom?: string; dateTo?: string; year?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dateFrom = body.dateFrom ? new Date(body.dateFrom) : new Date(new Date().getFullYear(), 0, 1);
  const dateTo = body.dateTo ? new Date(body.dateTo) : new Date();

  const [clients, demos, invoices, contracts] = await Promise.all([
    prisma.client.findMany(),
    prisma.demoRequest.findMany({ where: { createdAt: { gte: dateFrom, lte: dateTo } } }),
    prisma.invoice.findMany({ where: { issuedAt: { gte: dateFrom, lte: dateTo } } }),
    prisma.contract.findMany({ where: { startDate: { lte: dateTo } } }),
  ]);

  const revenue = invoices.reduce((s, i) => s + i.amount, 0);
  const summary = {
    clientCount: clients.length,
    activeClients: clients.filter((c) => c.status === "ACTIVE").length,
    demoRequests: demos.length,
    revenueInRange: revenue,
    contractCount: contracts.length,
  };

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Converis AI — Annual Report", 14, 20);
  doc.setFontSize(11);
  doc.text(`Period: ${dateFrom.toLocaleDateString()} – ${dateTo.toLocaleDateString()}`, 14, 30);
  let y = 42;
  const sections = [
    "Executive Summary",
    "Revenue Analysis",
    "Client Growth",
    "Churn Analysis",
    "Product Usage Stats",
    "Market Analysis",
    "Goals vs Actuals",
    "Next Year Projections",
  ];
  doc.setFontSize(12);
  for (const title of sections) {
    doc.text(title, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(
      `This section summarizes internal CRM metrics for the selected period. Revenue in range: $${revenue.toLocaleString()}. Active clients: ${summary.activeClients}. Demo requests: ${summary.demoRequests}.`,
      14,
      y,
      { maxWidth: 180 }
    );
    y += 18;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
  }

  const pdfBase64 = Buffer.from(doc.output("arraybuffer")).toString("base64");

  const report = await prisma.report.create({
    data: {
      title: `Annual Report ${body.year ?? dateFrom.getFullYear()}`,
      year: body.year ?? dateFrom.getFullYear(),
      dateFrom,
      dateTo,
      summaryJson: JSON.stringify(summary),
      pdfBase64,
      createdById: auth.session.id,
    },
  });

  return NextResponse.json({
    report: {
      id: report.id,
      title: report.title,
      year: report.year,
      dateFrom: report.dateFrom.toISOString(),
      dateTo: report.dateTo.toISOString(),
      createdAt: report.createdAt.toISOString(),
      summary,
    },
    pdfBase64,
  });
}
