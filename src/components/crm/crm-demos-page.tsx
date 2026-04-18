"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DownloadIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Demo = {
  id: string;
  createdAt: string;
  name: string;
  company: string;
  role: string;
  email: string;
  industry: string;
  message: string;
  status: string;
  notes: string;
  assignedTo: { id: string; name: string; email: string } | null;
};

const STATUSES = ["NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "LOST"] as const;

export function CrmDemosPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [stats, setStats] = useState({ total: 0, newThisWeek: 0, conversionRate: 0, avgResponseTimeHours: 0 });
  const [status, setStatus] = useState("");
  const [industry, setIndustry] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Demo | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    role: "",
    email: "",
    industry: "",
    message: "",
  });

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (industry) q.set("industry", industry);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const res = await fetch(`/api/crm/demos?${q}`, { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { demos: Demo[]; stats: typeof stats };
    setDemos(data.demos);
    setStats(data.stats);
  }, [status, industry, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportCsv() {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (industry) q.set("industry", industry);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    q.set("format", "csv");
    const res = await fetch(`/api/crm/demos?${q}`, { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "demo-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveDemo(partial: Partial<Demo>) {
    if (!selected) return;
    const res = await fetch(`/api/crm/demos/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(partial),
    });
    if (res.ok) {
      const data = (await res.json()) as { demo: Demo };
      setSelected(data.demo);
      void load();
    }
  }

  async function convertClient() {
    if (!selected) return;
    const res = await fetch(`/api/crm/demos/${selected.id}/convert`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      void load();
      setSelected(null);
    }
  }

  async function addDemo() {
    const res = await fetch("/api/crm/demos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setAddOpen(false);
      setForm({ name: "", company: "", role: "", email: "", industry: "", message: "" });
      void load();
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Demo Requests</h1>
          <p className="text-sm text-muted-foreground">Inbound pipeline for Converis AI.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-white/10"
            onClick={() => void exportCsv()}
          >
            <DownloadIcon className="size-4" />
            Export CSV
          </Button>
          <Button
            className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-[0_0_24px_-8px_rgba(124,58,237,0.45)]"
            onClick={() => setAddOpen(true)}
          >
            <PlusIcon className="size-4" />
            Add Demo Request
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase">Total</p>
          <p className="text-xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase">New this week</p>
          <p className="text-xl font-semibold text-white">{stats.newThisWeek}</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase">Conversion</p>
          <p className="text-xl font-semibold text-white">{stats.conversionRate}%</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase">Avg response</p>
          <p className="text-xl font-semibold text-white">{stats.avgResponseTimeHours}h</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-black/50 px-3 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Input
          placeholder="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="h-9 w-40 border-white/10 bg-black/50"
        />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40 border-white/10 bg-black/50" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40 border-white/10 bg-black/50" />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs text-muted-foreground uppercase">
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Industry</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {demos.map((d) => (
                <tr
                  key={d.id}
                  className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.04]"
                  onClick={() => setSelected(d)}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-white">{d.name}</td>
                  <td className="px-3 py-2">{d.company}</td>
                  <td className="px-3 py-2 text-muted-foreground">{d.role}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.email}</td>
                  <td className="px-3 py-2">{d.industry}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs">{d.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">{d.assignedTo?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl transition-transform duration-200",
          selected ? "translate-x-0" : "translate-x-full"
        )}
      >
        {selected && (
          <div className="flex h-full flex-col p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">{selected.company}</h2>
                <p className="text-sm text-muted-foreground">{selected.name}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <a className="text-[#93C5FD]" href={`mailto:${selected.email}`}>
                  {selected.email}
                </a>
              </p>
              <p>
                <span className="text-muted-foreground">Industry:</span> {selected.industry}
              </p>
              <p>
                <span className="text-muted-foreground">Message:</span> {selected.message || "—"}
              </p>
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <textarea
                  className="mt-1 min-h-[100px] w-full rounded-lg border border-white/10 bg-black/50 p-2 text-sm"
                  value={selected.notes}
                  onChange={(e) => setSelected({ ...selected, notes: e.target.value })}
                  onBlur={() => void saveDemo({ notes: selected.notes })}
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/50 px-2 text-sm"
                  value={selected.status}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelected({ ...selected, status: v });
                    void saveDemo({ status: v as Demo["status"] });
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
              <Button
                variant="outline"
                className="border-white/15"
                onClick={() => window.open(`mailto:${selected.email}?subject=Converis%20AI%20demo`)}
              >
                Send email
              </Button>
              <Button
                variant="outline"
                className="border-white/15"
                onClick={() => window.open(`https://cal.com`, "_blank")}
              >
                Schedule meeting
              </Button>
              <Button
                className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
                onClick={() => void convertClient()}
              >
                Convert to client
              </Button>
            </div>
          </div>
        )}
      </div>
      {selected && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50"
          aria-label="Close panel"
          onClick={() => setSelected(null)}
        />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add demo request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {(["name", "company", "role", "email", "industry"] as const).map((f) => (
              <div key={f}>
                <Label className="capitalize">{f}</Label>
                <Input
                  className="mt-1 border-white/10 bg-black/50"
                  value={form[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <Label>Message</Label>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-lg border border-white/10 bg-black/50 p-2 text-sm"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
              onClick={() => void addDemo()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
