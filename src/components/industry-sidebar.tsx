"use client";

import { ConverisLogoMark } from "@/components/converis-logo-mark";
import { INDUSTRIES } from "@/lib/industries";
import { cn } from "@/lib/utils";
import { useAppAuth } from "@/providers/app-auth-provider";
import { useDeals } from "@/providers/deals-provider";
import { ClipboardListIcon, LogOutIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function IndustrySidebar() {
  const { selectedIndustry, setSelectedIndustry } = useDeals();
  const { user } = useAppAuth();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  return (
    <aside className="flex h-full min-h-0 w-[220px] shrink-0 flex-col border-r border-cyan-500/12 bg-black/60 backdrop-blur-xl supports-backdrop-filter:bg-black/45">
      <div className="shrink-0 border-b border-cyan-500/12 px-4 py-4">
        <div className="mb-4 flex justify-center">
          <ConverisLogoMark size={44} className="drop-shadow-[0_0_14px_rgba(99,102,241,0.35)]" />
        </div>
        <p className="text-center text-[10px] font-semibold tracking-[0.2em] text-sky-200/55">
          INDUSTRIES
        </p>
        {user?.role === "ADMIN" && (
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/crm"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/35 bg-gradient-to-r from-[#2563EB]/20 to-[#7C3AED]/15 px-3 py-2 text-xs font-medium text-sky-100 transition hover:from-[#2563EB]/30 hover:to-[#7C3AED]/25"
            >
              <ClipboardListIcon className="size-3.5 opacity-90" />
              CRM
            </Link>
            <Link
              href="/app/admin"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20"
            >
              <ShieldIcon className="size-3.5 opacity-90" />
              Admin
            </Link>
          </div>
        )}
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {INDUSTRIES.map((name) => {
          const active = selectedIndustry === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedIndustry(name)}
              className={cn(
                "group relative rounded-lg px-3 py-2 text-left text-sm transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-sky-500/18 via-blue-600/10 to-transparent text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.22)]"
                  : "text-muted-foreground hover:bg-cyan-500/[0.06] hover:text-foreground"
              )}
            >
              {active && (
                <span
                  className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-400 to-blue-600"
                  aria-hidden
                />
              )}
              <span className="relative block truncate">{name}</span>
            </button>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-cyan-500/12 p-2">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/25 bg-white/[0.03] px-3 py-2.5 text-sm text-muted-foreground transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-foreground"
        >
          <LogOutIcon className="size-4 opacity-80" />
          Log out
        </button>
      </div>
    </aside>
  );
}
