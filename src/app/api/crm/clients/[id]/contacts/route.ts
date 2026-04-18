import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type P = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id: clientId } = await params;

  let body: { name?: string; role?: string; email?: string; phone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!name || !email) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      clientId,
      name,
      role: String(body.role ?? ""),
      email,
      phone: String(body.phone ?? ""),
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
