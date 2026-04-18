"use client";

import { StarfieldCanvas } from "@/components/starfield-canvas";
import type { SessionUser } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CrmAdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (cancelled) return;
      if (!res.ok) {
        router.replace("/login?redirect=/crm");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { user: SessionUser };
      if (data.user.role !== "ADMIN") {
        router.replace("/app");
        setLoading(false);
        return;
      }
      setUser(data.user);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-black">
        <StarfieldCanvas className="absolute inset-0 z-0 h-full w-full" />
        <div
          className="relative z-10 size-10 animate-spin rounded-full border-2 border-[#7C3AED]/30 border-t-[#2563EB]"
          aria-hidden
        />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
