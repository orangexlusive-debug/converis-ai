import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ContractStatus, ContractType } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type P = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ contract });
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
  if (body.type !== undefined) {
    const t = String(body.type) as ContractType;
    if (!Object.values(ContractType).includes(t)) return NextResponse.json({ error: "bad type" }, { status: 400 });
    data.type = t;
  }
  if (body.value !== undefined) data.value = Number(body.value);
  if (body.startDate !== undefined) data.startDate = new Date(String(body.startDate));
  if (body.endDate !== undefined) data.endDate = new Date(String(body.endDate));
  if (body.status !== undefined) {
    const s = String(body.status) as ContractStatus;
    if (!Object.values(ContractStatus).includes(s)) return NextResponse.json({ error: "bad status" }, { status: 400 });
    data.status = s;
  }
  if (body.autoRenew !== undefined) data.autoRenew = Boolean(body.autoRenew);
  if (body.pdfUrl !== undefined) data.pdfUrl = String(body.pdfUrl);

  const contract = await prisma.contract.update({ where: { id }, data, include: { client: true } });
  return NextResponse.json({ contract });
}
