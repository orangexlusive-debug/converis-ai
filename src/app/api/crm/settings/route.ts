import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  let settings = await prisma.crmSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.crmSettings.create({ data: { id: "singleton" } });
  }

  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;

  let body: Record<string, string>;
  try {
    body = (await request.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  const keys = [
    "companyName",
    "companyLogoUrl",
    "companyAddress",
    "billingInfo",
    "emailTemplatesJson",
    "integrationsJson",
    "notificationPrefsJson",
    "emailNotificationsJson",
  ] as const;
  for (const k of keys) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  const settings = await prisma.crmSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  return NextResponse.json({ settings });
}
