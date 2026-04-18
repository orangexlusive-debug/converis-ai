import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export type CrmAccessResult =
  | { ok: true; session: SessionUser }
  | { ok: false; response: NextResponse };

export async function requireCrmAdmin(request: NextRequest): Promise<CrmAccessResult> {
  const session = await getSessionUser(request);
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, session };
}
