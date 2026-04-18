"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardPayload = {
  kpis: {
    totalDemoRequests: number;
    activeClients: number;
    monthlyRevenue: number;
    annualRevenue: number;
    pipelineValue: number;
    churnRate: number;
  };
  revenueByMonth: { month: string; revenue: number }[];
  funnel: { stage: string; count: number; value: number }[];
  recentDemos: { id: string; company: string; status: string; createdAt: string }[];
  recentClients: { id: string; companyName: string; industry: string; createdAt: string }[];
  recentActivities: { id: string; title: string; type: string; createdAt: string }[];
  followUps: { id: string; company: string; name: string; status: string; updatedAt: string }[];
  topClients: {
    id: string;
    companyName: string;
    industry: string;
    contractValue: number;
    healthScore: number;
  }[];
};

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_0_30px_-12px_rgba(37,99,235,0.25)] backdrop-blur-sm">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 bg-gradient-to-r from-[#60A5FA] to-[#C4B5FD] bg-clip-text text-2xl font-semibold text-transparent">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function CrmDashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/crm/dashboard", { credentials: "include" });
      if (!res.ok) {
        if (!cancelled) setErr("Could not load dashboard.");
        return;
      }
      const j = (await res.json()) as DashboardPayload;
      if (!cancelled) setData(j);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-300">{err}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="size-10 animate-spin rounded-full border-2 border-[#7C3AED]/30 border-t-[#2563EB]" />
      </div>
    );
  }

  const chartData = data.revenueByMonth.map((r) => ({
    ...r,
    label: r.month.slice(5),
  }));

  const funnelData = data.funnel.map((f) => ({
    name: f.stage.replace(/_/g, " "),
    count: f.count,
    value: Math.round(f.value / 1000),
  }));

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">CRM Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Converis AI internal metrics — revenue, pipeline, and client motion.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Total Demo Requests" value={String(data.kpis.totalDemoRequests)} />
        <Kpi label="Active Clients" value={String(data.kpis.activeClients)} />
        <Kpi label="Monthly Revenue" value={`$${data.kpis.monthlyRevenue.toLocaleString()}`} />
        <Kpi label="Annual Revenue" value={`$${data.kpis.annualRevenue.toLocaleString()}`} />
        <Kpi label="Pipeline Value" value={`$${Math.round(data.kpis.pipelineValue).toLocaleString()}`} />
        <Kpi label="Churn Rate" value={`${data.kpis.churnRate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Revenue (12 months)</h2>
            <span className="text-xs text-muted-foreground">Invoices</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="revStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(0,0,0,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                  formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#revStroke)"
                  strokeWidth={2}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <h2 className="mb-4 text-sm font-semibold text-white">Pipeline funnel</h2>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis type="category" dataKey="name" width={100} stroke="#94A3B8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(0,0,0,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="url(#barGrad)" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Recent activity</h2>
          <ul className="space-y-2 text-sm">
            {data.recentActivities.slice(0, 8).map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-white">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.type}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Upcoming follow-ups</h2>
          <ul className="space-y-2 text-sm">
            {data.followUps.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-white">{f.company}</p>
                  <p className="text-xs text-muted-foreground">{f.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#C4B5FD]">{f.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Latest demo requests</h2>
            <Link
              href="/crm/demos"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 text-xs"
              )}
            >
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {data.recentDemos.map((d) => (
              <li key={d.id} className="flex justify-between gap-2 rounded-lg bg-black/30 px-3 py-2">
                <span className="font-medium text-white">{d.company}</span>
                <span className="text-xs text-muted-foreground">{d.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">New clients</h2>
            <Link
              href="/crm/clients"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 text-xs"
              )}
            >
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {data.recentClients.map((c) => (
              <li key={c.id} className="flex justify-between gap-2 rounded-lg bg-black/30 px-3 py-2">
                <span className="font-medium text-white">{c.companyName}</span>
                <span className="text-xs text-muted-foreground">{c.industry}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <h2 className="mb-4 text-sm font-semibold text-white">Top clients by revenue</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs text-muted-foreground uppercase">
                <th className="pb-2 font-medium">Company</th>
                <th className="pb-2 font-medium">Industry</th>
                <th className="pb-2 font-medium">Contract</th>
                <th className="pb-2 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {data.topClients.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04]">
                  <td className="py-2 font-medium text-white">{c.companyName}</td>
                  <td className="py-2 text-muted-foreground">{c.industry}</td>
                  <td className="py-2">${c.contractValue.toLocaleString()}</td>
                  <td className="py-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        c.healthScore >= 70
                          ? "bg-emerald-500/15 text-emerald-200"
                          : c.healthScore >= 45
                            ? "bg-amber-500/15 text-amber-200"
                            : "bg-red-500/15 text-red-200"
                      )}
                    >
                      {c.healthScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
