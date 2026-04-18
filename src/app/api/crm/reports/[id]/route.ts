import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCrmAdmin } from "@/lib/crm/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type P = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: P) {
  const auth = await requireCrmAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || !report.pdfBase64) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const buf = Buffer.from(report.pdfBase64, "base64");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.title.replace(/[^a-z0-9-_]+/gi, "_")}.pdf"`,
    },
  });
}
