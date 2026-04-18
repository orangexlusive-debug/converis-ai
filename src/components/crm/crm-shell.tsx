"use client";

import { ConverisLogoMark } from "@/components/converis-logo-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  Building2Icon,
  ClipboardListIcon,
  FileBarChartIcon,
  FileTextIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const NAV = [
  { href: "/crm", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/crm/demos", label: "Demo Requests", icon: MailIcon },
  { href: "/crm/clients", label: "Clients", icon: Building2Icon },
  { href: "/crm/pipeline", label: "Pipeline", icon: KanbanIcon },
  { href: "/crm/contracts", label: "Contracts", icon: FileTextIcon },
  { href: "/crm/reports", label: "Annual Reports", icon: FileBarChartIcon },
  { href: "/crm/team", label: "Team", icon: UsersIcon },
  { href: "/crm/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ id: string; title: string; subtitle: string; at: string }[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  const loadNotifs = useCallback(async () => {
    const res = await fetch("/api/crm/notifications", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as {
        items: { id: string; title: string; subtitle: string; at: string }[];
      };
      setNotifs(data.items);
    }
  }, []);

  useEffect(() => {
    void loadNotifs();
  }, [loadNotifs]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-black text-foreground">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, #2563EB 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 100% 0%, #7C3AED 0%, transparent 45%)",
        }}
      />

      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-black/70 px-4 backdrop-blur-xl lg:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/crm"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white"
          >
            <span className="rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-1.5 shadow-[0_0_20px_-4px_rgba(124,58,237,0.55)]">
              <ClipboardListIcon className="size-4 text-white" />
            </span>
            <span className="bg-gradient-to-r from-[#60A5FA] to-[#C4B5FD] bg-clip-text text-transparent">
              Converis CRM
            </span>
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">Internal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={bellRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="relative text-muted-foreground hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen((o) => !o);
                void loadNotifs();
              }}
            >
              <BellIcon className="size-4" />
              {notifs.length > 0 && (
                <span className="absolute top-1 right-1 size-2 rounded-full bg-[#7C3AED] ring-2 ring-black" />
              )}
            </Button>
            {notifOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 w-80 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-white/10 bg-black/95 p-2 shadow-[0_0_40px_-8px_rgba(37,99,235,0.35)] backdrop-blur-xl">
                <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Notifications
                </p>
                {notifs.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
                ) : (
                  notifs.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-white">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.subtitle}</p>
                    </div>
                  ))
                )}
                <Link
                  href="/crm/settings#email"
                  className="mt-2 block rounded-lg px-2 py-2 text-center text-xs text-[#93C5FD] hover:bg-white/[0.04]"
                  onClick={() => setNotifOpen(false)}
                >
                  Email &amp; notification preferences
                </Link>
              </div>
            )}
          </div>
          <Link
            href="/app"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10 bg-white/[0.03] text-xs"
            )}
          >
            Platform
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => void logout()}
          >
            <LogOutIcon className="size-4" />
          </Button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        <aside className="flex w-[240px] shrink-0 flex-col border-r border-white/[0.08] bg-black/60 backdrop-blur-xl">
          <div className="border-b border-white/[0.08] px-4 py-4">
            <div className="mb-3 flex justify-center">
              <ConverisLogoMark size={40} className="opacity-95" />
            </div>
            <p className="text-center text-[10px] font-semibold tracking-[0.2em] text-[#93C5FD]/70">
              CRM
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/crm"
                  ? pathname === "/crm"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                    isActive
                      ? "bg-gradient-to-r from-[#2563EB]/25 to-[#7C3AED]/15 text-white shadow-[inset_0_0_0_1px_rgba(124,58,237,0.25)]"
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
