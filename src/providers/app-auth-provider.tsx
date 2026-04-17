"use client";

import type { SessionUser } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AppAuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { user: SessionUser };
      setUser(data.user);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (cancelled) return;
      if (res.ok) {
        const data = (await res.json()) as { user: SessionUser };
        setUser(data.user);
      } else {
        setUser(null);
        const path =
          typeof window !== "undefined" ? window.location.pathname || "/app" : "/app";
        router.replace(`/login?redirect=${encodeURIComponent(path)}`);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div
          className="size-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400"
          aria-hidden
        />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppAuthContext.Provider value={{ user, loading: false, refresh }}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }
  return ctx;
}
