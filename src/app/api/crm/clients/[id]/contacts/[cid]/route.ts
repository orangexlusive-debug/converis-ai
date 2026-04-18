import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type P = { params: Promise<{ id: string; cid: string }> };

export async function PATCH(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id: clientId, cid } = await params;

  const existing = await prisma.contact.findFirst({ where: { id: cid, clientId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { name?: string; role?: string; email?: string; phone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contact = await prisma.contact.update({
    where: { id: cid },
    data: {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.role !== undefined ? { role: String(body.role) } : {}),
      ...(body.email !== undefined ? { email: String(body.email) } : {}),
      ...(body.phone !== undefined ? { phone: String(body.phone) } : {}),
    },
  });

  return NextResponse.json({ contact });
}

export async function DELETE(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id: clientId, cid } = await params;
  const existing = await prisma.contact.findFirst({ where: { id: cid, clientId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.contact.delete({ where: { id: cid } });
  return NextResponse.json({ ok: true });
}
