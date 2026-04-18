"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileDownIcon, FileTextIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const COLORS = ["#2563EB", "#7C3AED", "#38BDF8", "#A78BFA", "#22D3EE", "#C084FC"];

type ReportListItem = {
  id: string;
  title: string;
  year: number | null;
  dateFrom: string;
  dateTo: string;
  createdAt: string;
};

function downloadBase64Pdf(base64: string, filename: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: string[][]) {
  return rows.map((r) => r.map((c) => (c.includes(",") ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
}

export function CrmReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [dash, setDash] = useState<{
    revenueByMonth: { month: string; revenue: number }[];
    kpis: { activeClients: number; totalDemoRequests: number };
  } | null>(null);
  const [clients, setClients] = useState<{ companyName: string; industry: string; createdAt: string; address: string }[]>(
    []
  );

  const loadReports = useCallback(async () => {
    const res = await fetch("/api/crm/reports", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { reports: ReportListItem[] };
    setReports(data.reports);
  }, []);

  const loadCharts = useCallback(async () => {
    const [dRes, cRes] = await Promise.all([
      fetch("/api/crm/dashboard", { credentials: "include" }),
      fetch("/api/crm/clients", { credentials: "include" }),
    ]);
    if (dRes.ok) {
      const d = (await dRes.json()) as {
        revenueByMonth: { month: string; revenue: number }[];
        kpis: { activeClients: number; totalDemoRequests: number };
      };
      setDash({ revenueByMonth: d.revenueByMonth, kpis: d.kpis });
    }
    if (cRes.ok) {
      const c = (await cRes.json()) as {
        clients: { companyName: string; industry: string; createdAt: string; address: string }[];
      };
      setClients(c.clients);
    }
  }, []);

  useEffect(() => {
    void loadReports();
    void loadCharts();
  }, [loadReports, loadCharts]);

  const industryData = useMemo(() => {
    const m = new Map<string, number>();
    for (const cl of clients) {
      const k = cl.industry || "Other";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const geoData = useMemo(() => {
    const m = new Map<string, number>();
    for (const cl of clients) {
      const parts = (cl.address || "").split(",").map((s) => s.trim());
      const region = parts.length >= 2 ? parts[parts.length - 1]!.slice(0, 24) : "Unknown";
      m.set(region || "Unknown", (m.get(region) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const acquisition = useMemo(() => {
    const m = new Map<string, number>();
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(key, 0);
    }
    for (const cl of clients) {
      if (!cl.createdAt) continue;
      const dt = new Date(cl.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (m.has(key)) m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([month, count]) => ({ month, count }));
  }, [clients]);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch("/api/crm/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dateFrom: from || undefined,
          dateTo: to || undefined,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { pdfBase64: string; report: { title: string } };
      downloadBase64Pdf(data.pdfBase64, `${data.report.title.replace(/\s+/g, "-")}.pdf`);
      void loadReports();
    } finally {
      setBusy(false);
    }
  }

  function exportDataCsv() {
    const rows: string[][] = [
      ["Company", "Industry", "Created"],
      ...clients.map((c) => [
        c.companyName,
        c.industry,
        c.createdAt ? new Date(c.createdAt).toISOString() : "",
      ]),
    ];
    const blob = new Blob(["\ufeff", toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcelFriendly() {
    exportDataCsv();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Annual reports</h1>
        <p className="text-sm text-muted-foreground">
          Executive PDF summaries, analytics, and exports for leadership reviews.
        </p>
        {dash?.kpis && (
          <p className="mt-2 text-xs text-muted-foreground">
            Snapshot:{" "}
            <span className="text-foreground">{dash.kpis.activeClients}</span> active clients ·{" "}
            <span className="text-foreground">{dash.kpis.totalDemoRequests}</span> demo requests (all time)
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div>
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            className="mt-1 h-9 border-white/10 bg-black/50"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            className="mt-1 h-9 border-white/10 bg-black/50"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <Button
          className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
          disabled={busy}
          onClick={() => void generate()}
        >
          <FileTextIcon className="size-4" />
          {busy ? "Generating…" : "Generate report (PDF)"}
        </Button>
        <Button variant="outline" className="border-white/10" onClick={exportDataCsv}>
          <FileDownIcon className="size-4" />
          Export data (CSV)
        </Button>
        <Button variant="outline" className="border-white/10" onClick={exportExcelFriendly}>
          Export (Excel-ready CSV)
        </Button>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-[#93C5FD] uppercase">Revenue growth</p>
          <div className="h-56">
            {dash && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dash.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #ffffff20" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="url(#revGrad)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-[#93C5FD] uppercase">Client acquisition</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acquisition}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0a0a0a", border: "1px solid #ffffff20" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-[#93C5FD] uppercase">Industry breakdown</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={industryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {industryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #ffffff20" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-[#93C5FD] uppercase">Geographic distribution</p>
          <p className="mb-2 text-[10px] text-muted-foreground">Derived from client HQ address (last segment).</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #ffffff20" }} />
                <Bar dataKey="value" fill="#7C3AED" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">Historical reports</h2>
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs text-muted-foreground uppercase">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Download</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.04]">
                  <td className="px-3 py-2 text-white">{r.title}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.dateFrom).toLocaleDateString()} — {new Date(r.dateTo).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      className="text-[#93C5FD] hover:underline"
                      href={`/api/crm/reports/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PDF
                    </a>
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
