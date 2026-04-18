"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { UploadIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ContractRow = {
  id: string;
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
  pdfUrl: string;
  client: { id: string; companyName: string; industry: string };
};

function renewalTone(days: number) {
  if (days < 30) return "text-red-400";
  if (days < 90) return "text-amber-400";
  return "text-emerald-400";
}

export function CrmContractsPage() {
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState<(ContractRow & { daysUntilRenewal: number })[]>([]);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [expBefore, setExpBefore] = useState("");
  const [detail, setDetail] = useState<(ContractRow & { client: ContractRow["client"] }) | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (type) q.set("type", type);
    if (expBefore) q.set("expBefore", expBefore);
    const res = await fetch(`/api/crm/contracts?${q}`, { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      contracts: ContractRow[];
      totalValue: number;
      expiringSoon: (ContractRow & { daysUntilRenewal: number })[];
    };
    setRows(data.contracts);
    setTotalValue(data.totalValue);
    setExpiringSoon(data.expiringSoon);
  }, [status, type, expBefore]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id: string) {
    const res = await fetch(`/api/crm/contracts/${id}`, { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { contract: ContractRow };
    setDetail(data.contract);
  }

  async function patchContract(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/crm/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    void load();
    const j = (await res.json()) as { contract: ContractRow };
    if (detail?.id === id) setDetail(j.contract);
  }

  async function onUploadPdf(id: string, file: File | null) {
    if (!file) return;
    setUploadingId(id);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? "");
      await patchContract(id, { pdfUrl: dataUrl.slice(0, 500_000) });
      setUploadingId(null);
    };
    reader.readAsDataURL(file);
  }

  const now = Date.now();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Active contract value:{" "}
            <span className="bg-gradient-to-r from-[#60A5FA] to-[#C4B5FD] bg-clip-text font-semibold text-transparent">
              ${Math.round(totalValue).toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
          <p className="text-xs font-semibold tracking-wide text-amber-200/90 uppercase">Renewal reminders</p>
          <ul className="mt-2 space-y-1 text-sm">
            {expiringSoon.slice(0, 6).map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <button
                  type="button"
                  className="text-left text-white hover:text-[#93C5FD]"
                  onClick={() => void openDetail(c.id)}
                >
                  {c.client.companyName}
                </button>
                <span className={cn("shrink-0 text-xs", renewalTone(c.daysUntilRenewal))}>
                  {c.daysUntilRenewal}d to renewal
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-black/50 px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="PENDING">PENDING</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-black/50 px-3 text-sm"
        >
          <option value="">All types</option>
          <option value="ANNUAL">ANNUAL</option>
          <option value="MONTHLY">MONTHLY</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
        <Input
          type="date"
          className="h-9 w-44 border-white/10 bg-black/50 text-xs"
          value={expBefore}
          onChange={(e) => setExpBefore(e.target.value)}
          title="End on or before"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs text-muted-foreground uppercase">
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Value</th>
                <th className="px-3 py-3">Start</th>
                <th className="px-3 py-3">End</th>
                <th className="px-3 py-3">Days</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Auto-renew</th>
                <th className="px-3 py-3">PDF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const days = Math.ceil((new Date(c.endDate).getTime() - now) / 86400000);
                return (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.04]"
                    onClick={() => void openDetail(c.id)}
                  >
                    <td className="px-3 py-2 font-medium text-white">{c.client.companyName}</td>
                    <td className="px-3 py-2">{c.type}</td>
                    <td className="px-3 py-2">${c.value.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(c.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(c.endDate).toLocaleDateString()}
                    </td>
                    <td className={cn("px-3 py-2 text-xs font-medium", renewalTone(days))}>{days}d</td>
                    <td className="px-3 py-2 text-xs">{c.status}</td>
                    <td
                      className="px-3 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={c.autoRenew}
                        onChange={(e) => void patchContract(c.id, { autoRenew: e.target.checked })}
                        className="accent-[#7C3AED]"
                      />
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#93C5FD]">
                        <UploadIcon className="size-3.5" />
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          disabled={uploadingId === c.id}
                          onChange={(e) => void onUploadPdf(c.id, e.target.files?.[0] ?? null)}
                        />
                        {uploadingId === c.id ? "…" : c.pdfUrl ? "Replace" : "Upload"}
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.client.companyName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Type:</span> {detail.type}
                </p>
                <p>
                  <span className="text-muted-foreground">Value:</span> $
                  {detail.value.toLocaleString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Term:</span>{" "}
                  {new Date(detail.startDate).toLocaleDateString()} —{" "}
                  {new Date(detail.endDate).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <Label>Status</Label>
                  <select
                    className="rounded border border-white/10 bg-black/50 px-2 py-1"
                    value={detail.status}
                    onChange={(e) => void patchContract(detail.id, { status: e.target.value })}
                  >
                    {["ACTIVE", "EXPIRED", "PENDING", "CANCELLED"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ar"
                    checked={detail.autoRenew}
                    onChange={(e) => void patchContract(detail.id, { autoRenew: e.target.checked })}
                    className="accent-[#7C3AED]"
                  />
                  <Label htmlFor="ar">Auto-renew</Label>
                </div>
                {detail.pdfUrl && (
                  <a
                    className="text-[#93C5FD] underline"
                    href={detail.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View uploaded PDF
                  </a>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetail(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
