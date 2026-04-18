import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ClientStatus } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type P = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const demo = await prisma.demoRequest.findUnique({ where: { id } });
  if (!demo) return NextResponse.json({ error: "Demo not found" }, { status: 404 });

  const existing = await prisma.client.findFirst({
    where: { companyName: demo.company },
  });
  if (existing) {
    return NextResponse.json({ error: "Client with this company already exists.", clientId: existing.id }, { status: 409 });
  }

  const client = await prisma.client.create({
    data: {
      companyName: demo.company,
      industry: demo.industry,
      contractValue: 0,
      status: ClientStatus.ACTIVE,
      assignedToId: demo.assignedToId ?? auth.session.id,
      healthScore: 75,
      billingEmail: demo.email,
    },
  });

  await prisma.contact.create({
    data: {
      clientId: client.id,
      name: demo.name,
      role: demo.role,
      email: demo.email,
    },
  });

  await prisma.demoRequest.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  await prisma.activity.create({
    data: {
      type: "client",
      title: "Converted demo to client",
      description: demo.company,
      clientId: client.id,
      demoRequestId: id,
      actorId: auth.session.id,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
