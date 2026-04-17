"use client";

import { getStoredToken } from "@/lib/auth-storage";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      const next = `/login?redirect=${encodeURIComponent(pathname || "/app")}`;
      router.replace(next);
      return;
    }
    setAllowed(true);
  }, [router, pathname]);

  if (!allowed) {
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

  return <>{children}</>;
}
