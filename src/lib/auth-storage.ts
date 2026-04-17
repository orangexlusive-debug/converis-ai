export const AUTH_TOKEN_KEY = "converis-auth-token";
export const AUTH_USER_KEY = "converis-auth-user";

export type AuthUser = {
  email: string;
  name: string;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "email" in parsed &&
      "name" in parsed &&
      typeof (parsed as AuthUser).email === "string" &&
      typeof (parsed as AuthUser).name === "string"
    ) {
      return { email: (parsed as AuthUser).email, name: (parsed as AuthUser).name };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken());
}
