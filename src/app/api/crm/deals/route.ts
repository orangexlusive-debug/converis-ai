import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PipelineStage, Prisma } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const assigned = searchParams.get("assigned");
  const industry = searchParams.get("industry");
  const min = searchParams.get("minValue");
  const max = searchParams.get("maxValue");

  const where: Prisma.DealWhereInput = {};
  if (assigned) where.assignedToId = assigned;
  if (min || max) {
    where.estimatedValue = {};
    if (min) where.estimatedValue.gte = Number(min);
    if (max) where.estimatedValue.lte = Number(max);
  }
  if (industry) {
    where.client = { is: { industry } };
  }

  const deals = await prisma.deal.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { assignedTo: { select: { id: true, name: true } }, client: { select: { industry: true } } },
  });

  const pipelineValue = deals
    .filter((d) => d.stage !== "CLOSED_LOST" && d.stage !== "CLOSED_WON")
    .reduce((s, d) => s + d.estimatedValue, 0);

  return NextResponse.json({ deals, pipelineValue });
}

export async function POST(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  let body: {
    companyName?: string;
    stage?: PipelineStage;
    estimatedValue?: number;
    probability?: number;
    assignedToId?: string | null;
    nextAction?: string;
    clientId?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const companyName = String(body.companyName ?? "").trim();
  if (!companyName) return NextResponse.json({ error: "companyName required" }, { status: 400 });

  const deal = await prisma.deal.create({
    data: {
      companyName,
      stage: body.stage && Object.values(PipelineStage).includes(body.stage) ? body.stage : "LEAD",
      estimatedValue: Number(body.estimatedValue ?? 0),
      probability: Number(body.probability ?? 20),
      assignedToId: body.assignedToId ?? null,
      nextAction: String(body.nextAction ?? ""),
      clientId: body.clientId ?? null,
      stageEnteredAt: new Date(),
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ deal }, { status: 201 });
}
