import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PipelineStage } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type P = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { assignedTo: { select: { id: true, name: true, email: true } }, client: true },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deal });
}

export async function PATCH(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: {
    stage?: PipelineStage;
    estimatedValue?: number;
    probability?: number;
    assignedToId?: string | null;
    nextAction?: string;
    clientId?: string | null;
    companyName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.deal.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.estimatedValue !== undefined) data.estimatedValue = Number(body.estimatedValue);
  if (body.probability !== undefined) data.probability = Number(body.probability);
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId;
  if (body.nextAction !== undefined) data.nextAction = String(body.nextAction);
  if (body.clientId !== undefined) data.clientId = body.clientId;
  if (body.companyName !== undefined) data.companyName = String(body.companyName);
  if (body.stage !== undefined) {
    if (!Object.values(PipelineStage).includes(body.stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    data.stage = body.stage;
    if (body.stage !== existing.stage) {
      data.stageEnteredAt = new Date();
    }
  }

  const deal = await prisma.deal.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true } }, client: true },
  });

  return NextResponse.json({ deal });
}

export async function DELETE(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  await prisma.activity.deleteMany({ where: { dealId: id } });
  await prisma.deal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
