import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DemoRequestStatus } from "@prisma/client";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type P = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const demo = await prisma.demoRequest.findUnique({
    where: { id },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });
  if (!demo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ demo });
}

export async function PATCH(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: {
    status?: DemoRequestStatus;
    notes?: string;
    assignedToId?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!Object.values(DemoRequestStatus).includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.notes !== undefined) data.notes = String(body.notes);
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId;

  const demo = await prisma.demoRequest.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "demo",
      title: "Demo request updated",
      description: `Status or assignment changed`,
      demoRequestId: id,
      actorId: auth.session.id,
    },
  });

  return NextResponse.json({ demo });
}

export async function DELETE(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  await prisma.activity.deleteMany({ where: { demoRequestId: id } });
  await prisma.demoRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
