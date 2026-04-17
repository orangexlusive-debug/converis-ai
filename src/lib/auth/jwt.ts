import { SignJWT, jwtVerify } from "jose";

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set to a strong value in production.");
    }
    return new TextEncoder().encode("converis-dev-jwt-secret-min-16-chars");
  }
  return new TextEncoder().encode(s);
}

export async function signAuthToken(payload: {
  sub: string;
  email: string;
  role: "ADMIN" | "USER";
}): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<{
  sub: string;
  email: string;
  role: "ADMIN" | "USER";
}> {
  const { payload } = await jwtVerify(token, getSecret());
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  const role = payload.role === "ADMIN" || payload.role === "USER" ? payload.role : "USER";
  return { sub, email, role };
}
