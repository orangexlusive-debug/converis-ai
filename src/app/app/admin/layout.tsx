"use client";

import { useAppAuth } from "@/providers/app-auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.replace("/app");
    }
  }, [user, router]);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div
          className="size-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400"
          aria-hidden
        />
      </div>
    );
  }

  return <>{children}</>;
}
