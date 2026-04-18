import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ContractStatus, ContractType, Prisma } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ContractStatus | null;
  const type = searchParams.get("type") as ContractType | null;
  const expBefore = searchParams.get("expBefore");

  const where: Prisma.ContractWhereInput = {};
  if (status && Object.values(ContractStatus).includes(status)) where.status = status;
  if (type && Object.values(ContractType).includes(type)) where.type = type;
  if (expBefore) where.endDate = { lte: new Date(expBefore) };

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { endDate: "asc" },
    include: { client: { select: { id: true, companyName: true, industry: true } } },
  });

  const now = new Date();
  const totalValue = contracts
    .filter((c) => c.status === ContractStatus.ACTIVE)
    .reduce((s, c) => s + c.value, 0);

  const expiringSoon = contracts
    .filter((c) => c.status === ContractStatus.ACTIVE)
    .map((c) => {
      const days = Math.ceil((c.endDate.getTime() - now.getTime()) / 86400000);
      return { ...c, daysUntilRenewal: days };
    })
    .filter((c) => c.daysUntilRenewal <= 90)
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);

  return NextResponse.json({ contracts, totalValue, expiringSoon });
}

export async function POST(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  let body: {
    clientId?: string;
    type?: ContractType;
    value?: number;
    startDate?: string;
    endDate?: string;
    status?: ContractStatus;
    autoRenew?: boolean;
    pdfUrl?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.clientId || !body.startDate || !body.endDate) {
    return NextResponse.json({ error: "clientId, startDate, endDate required" }, { status: 400 });
  }

  const contract = await prisma.contract.create({
    data: {
      clientId: body.clientId,
      type: body.type && Object.values(ContractType).includes(body.type) ? body.type : "ANNUAL",
      value: Number(body.value ?? 0),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status && Object.values(ContractStatus).includes(body.status) ? body.status : "ACTIVE",
      autoRenew: Boolean(body.autoRenew),
      pdfUrl: String(body.pdfUrl ?? ""),
    },
    include: { client: { select: { companyName: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "contract",
      title: "Contract created",
      description: contract.client.companyName,
      clientId: contract.clientId,
      contractId: contract.id,
      actorId: auth.session.id,
    },
  });

  return NextResponse.json({ contract }, { status: 201 });
}
