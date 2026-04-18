"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Building2Icon, LayoutGridIcon, ListIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ClientRow = {
  id: string;
  companyName: string;
  industry: string;
  contractValue: number;
  startDate: string | null;
  status: string;
  healthScore: number;
  assignedTo: { id: string; name: string; email: string } | null;
  _count: { contacts: number; contracts: number };
};

type FullClient = ClientRow & {
  notes: string;
  address: string;
  billingEmail: string;
  contacts: { id: string; name: string; role: string; email: string; phone: string }[];
  deals: { id: string; companyName: string; stage: string; estimatedValue: number; probability: number }[];
  contracts: { id: string; type: string; value: number; startDate: string; endDate: string; status: string }[];
  activities: { id: string; type: string; title: string; description: string; createdAt: string }[];
  invoices: { id: string; amount: number; issuedAt: string; status: string; memo: string }[];
  pmiDeals: { name: string; industry: string; analyzedAt: string; model: string }[];
};

type TeamUser = { id: string; name: string; email: string };

const TABS = ["Overview", "Contacts", "Deals", "Documents", "Activity", "Invoices"] as const;

function healthColor(score: number) {
  if (score >= 70) return "from-emerald-400 to-emerald-600";
  if (score >= 40) return "from-amber-400 to-orange-500";
  return "from-red-400 to-rose-600";
}

export function CrmClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState("");
  const [manager, setManager] = useState("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [full, setFull] = useState<FullClient | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    companyName: "",
    industry: "",
    contractValue: "",
    startDate: "",
    status: "ACTIVE",
    healthScore: "80",
    address: "",
    billingEmail: "",
    notes: "",
    assignedToId: "",
  });
  const [contactForm, setContactForm] = useState({ name: "", role: "", email: "", phone: "" });

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadList = useCallback(async () => {
    const params = new URLSearchParams();
    if (industry) params.set("industry", industry);
    if (status) params.set("status", status);
    if (manager) params.set("manager", manager);
    if (qDebounced) params.set("q", qDebounced);
    const res = await fetch(`/api/crm/clients?${params}`, { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { clients: ClientRow[] };
    setClients(data.clients);
  }, [industry, status, manager, qDebounced]);

  const loadTeam = useCallback(async () => {
    const res = await fetch("/api/crm/team", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { team: { id: string; name: string; email: string }[] };
    setTeam(data.team.map((u) => ({ id: u.id, name: u.name, email: u.email })));
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    if (!selectedId) {
      setFull(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/crm/clients/${selectedId}`, { credentials: "include" });
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { client: FullClient };
      if (!cancelled) setFull(data.client);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function saveClient(patch: Record<string, unknown>) {
    if (!full) return;
    const res = await fetch(`/api/crm/clients/${full.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = (await res.json()) as { client: FullClient };
      setFull(data.client);
      void loadList();
    }
  }

  async function addClient() {
    const res = await fetch("/api/crm/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        companyName: addForm.companyName,
        industry: addForm.industry,
        contractValue: Number(addForm.contractValue || 0),
        startDate: addForm.startDate || null,
        status: addForm.status,
        healthScore: Number(addForm.healthScore || 80),
        address: addForm.address,
        billingEmail: addForm.billingEmail,
        notes: addForm.notes,
        assignedToId: addForm.assignedToId || null,
      }),
    });
    if (res.ok) {
      setAddOpen(false);
      setAddForm({
        companyName: "",
        industry: "",
        contractValue: "",
        startDate: "",
        status: "ACTIVE",
        healthScore: "80",
        address: "",
        billingEmail: "",
        notes: "",
        assignedToId: "",
      });
      void loadList();
    }
  }

  async function addContact() {
    if (!full) return;
    const res = await fetch(`/api/crm/clients/${full.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(contactForm),
    });
    if (res.ok) {
      setContactForm({ name: "", role: "", email: "", phone: "" });
      const data = (await res.json()) as { contact: FullClient["contacts"][0] };
      setFull({ ...full, contacts: [...full.contacts, data.contact] });
    }
  }

  const usageStats = useMemo(() => {
    if (!full) return null;
    const deals = full.pmiDeals?.length ?? 0;
    return { dealsAnalyzed: deals, lastActive: full.activities[0]?.createdAt };
  }, [full]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Clients</h1>
          <p className="text-sm text-muted-foreground">Account health, contracts, and relationships.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={view === "grid" ? "secondary" : "ghost"}
              className={cn(view === "grid" && "bg-white/10")}
              onClick={() => setView("grid")}
            >
              <LayoutGridIcon className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "list" ? "secondary" : "ghost"}
              className={cn(view === "list" && "bg-white/10")}
              onClick={() => setView("list")}
            >
              <ListIcon className="size-4" />
            </Button>
          </div>
          <Button
            className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
            onClick={() => setAddOpen(true)}
          >
            <PlusIcon className="size-4" />
            Add client
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9 w-52 border-white/10 bg-black/50"
        />
        <Input
          placeholder="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="h-9 w-40 border-white/10 bg-black/50"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-black/50 px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CHURNED">Churned</option>
          <option value="PAUSED">Paused</option>
        </select>
        <select
          value={manager}
          onChange={(e) => setManager(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-black/50 px-3 text-sm"
        >
          <option value="">All managers</option>
          {team.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedId(c.id);
                setTab("Overview");
              }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition hover:border-[#7C3AED]/40 hover:bg-white/[0.05]"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-[#2563EB]/30 to-[#7C3AED]/20">
                  <Building2Icon className="size-5 text-[#93C5FD]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{c.companyName}</p>
                  <p className="text-xs text-muted-foreground">{c.industry}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-medium text-white">${c.contractValue.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Health</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r", healthColor(c.healthScore))}
                      style={{ width: `${c.healthScore}%` }}
                    />
                  </div>
                  <span className="text-white">{c.healthScore}</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {c.assignedTo?.name ?? "Unassigned"} · {c.status}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-muted-foreground uppercase">
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Industry</th>
                  <th className="px-3 py-3">Value</th>
                  <th className="px-3 py-3">Start</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Manager</th>
                  <th className="px-3 py-3">Health</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.04]"
                    onClick={() => {
                      setSelectedId(c.id);
                      setTab("Overview");
                    }}
                  >
                    <td className="px-3 py-2 font-medium text-white">{c.companyName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.industry}</td>
                    <td className="px-3 py-2">${c.contractValue.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">{c.status}</td>
                    <td className="px-3 py-2 text-xs">{c.assignedTo?.name ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-white/[0.08] px-2 py-0.5 text-xs">{c.healthScore}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-full max-w-lg border-l border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl transition-transform duration-200",
          selectedId ? "translate-x-0" : "translate-x-full"
        )}
      >
        {full && (
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">{full.companyName}</h2>
                  <p className="text-xs text-muted-foreground">{full.industry}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  Close
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                      tab === t
                        ? "bg-gradient-to-r from-[#2563EB]/40 to-[#7C3AED]/30 text-white"
                        : "text-muted-foreground hover:bg-white/[0.06]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-sm">
              {tab === "Overview" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-muted-foreground">Health</span>
                    <div className="h-2 min-w-[120px] max-w-[200px] flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r", healthColor(full.healthScore))}
                        style={{ width: `${full.healthScore}%` }}
                      />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-8 w-16 border-white/10 bg-black/50 px-2 text-xs"
                      defaultValue={full.healthScore}
                      key={`${full.id}-hs`}
                      onBlur={(e) => void saveClient({ healthScore: Number(e.target.value) })}
                    />
                  </div>
                  <p>
                    <span className="text-muted-foreground">Billing:</span> {full.billingEmail || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Address:</span> {full.address || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Contract value:</span> $
                    {full.contractValue.toLocaleString()}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <select
                      className="ml-2 rounded border border-white/10 bg-black/50 px-2 py-1"
                      value={full.status}
                      onChange={(e) => void saveClient({ status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="CHURNED">CHURNED</option>
                      <option value="PAUSED">PAUSED</option>
                    </select>
                  </p>
                  <div>
                    <Label className="text-muted-foreground">Account manager</Label>
                    <select
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-2"
                      value={full.assignedTo?.id ?? ""}
                      onChange={(e) =>
                        void saveClient({ assignedToId: e.target.value || null })
                      }
                    >
                      <option value="">Unassigned</option>
                      {team.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Internal notes</Label>
                    <textarea
                      key={`${full.id}-notes`}
                      className="mt-1 min-h-[72px] w-full rounded-lg border border-white/10 bg-black/50 p-2"
                      defaultValue={full.notes ?? ""}
                      placeholder="Strategy, risks, next steps…"
                      onBlur={(e) => void saveClient({ notes: e.target.value })}
                    />
                  </div>
                  {usageStats && (
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
                      <p className="text-xs font-semibold tracking-wide text-[#93C5FD] uppercase">
                        Converis AI usage
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        PMI analyses on file:{" "}
                        <span className="text-white">{usageStats.dealsAnalyzed}</span>
                      </p>
                      {usageStats.lastActive && (
                        <p className="text-xs text-muted-foreground">
                          Last activity {new Date(usageStats.lastActive).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {tab === "Contacts" && (
                <div className="space-y-3">
                  {full.contacts.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <p className="font-medium text-white">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.role}</p>
                      <p className="text-xs">
                        <a className="text-[#93C5FD]" href={`mailto:${c.email}`}>
                          {c.email}
                        </a>{" "}
                        · {c.phone || "—"}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-lg border border-dashed border-white/15 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Add contact</p>
                    <div className="grid gap-2">
                      <Input
                        placeholder="Name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="border-white/10 bg-black/50"
                      />
                      <Input
                        placeholder="Role"
                        value={contactForm.role}
                        onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                        className="border-white/10 bg-black/50"
                      />
                      <Input
                        placeholder="Email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="border-white/10 bg-black/50"
                      />
                      <Input
                        placeholder="Phone"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="border-white/10 bg-black/50"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => void addContact()}>
                        Add contact
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {tab === "Deals" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">CRM pipeline deals linked to this client.</p>
                  {full.deals.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <p className="font-medium text-white">{d.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.stage.replace(/_/g, " ")} · ${d.estimatedValue.toLocaleString()} ·{" "}
                        {d.probability}%
                      </p>
                    </div>
                  ))}
                  {full.pmiDeals?.length > 0 && (
                    <>
                      <p className="pt-2 text-xs font-semibold text-[#93C5FD] uppercase">
                        Analyzed in platform
                      </p>
                      {full.pmiDeals.map((p, i) => (
                        <div
                          key={`${p.name}-${i}`}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                        >
                          <p className="font-medium text-white">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.industry} · {p.analyzedAt} · {p.model}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              {tab === "Documents" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Contracts and agreements on file.</p>
                  {full.contracts.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <p className="font-medium text-white">{c.type}</p>
                      <p className="text-xs text-muted-foreground">
                        ${c.value.toLocaleString()} · {c.status} · ends{" "}
                        {new Date(c.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {tab === "Activity" && (
                <div className="space-y-2">
                  {full.activities.map((a) => (
                    <div key={a.id} className="border-b border-white/[0.06] py-2 text-xs">
                      <p className="font-medium text-white">{a.title}</p>
                      <p className="text-muted-foreground">{a.description}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()} · {a.type}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {tab === "Invoices" && (
                <div className="space-y-2">
                  {full.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-white">${inv.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{inv.memo || "Invoice"}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {new Date(inv.issuedAt).toLocaleDateString()}
                        <br />
                        {inv.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedId && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50"
          aria-label="Close panel"
          onClick={() => setSelectedId(null)}
        />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add client</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {(
              [
                ["companyName", "Company name"],
                ["industry", "Industry"],
                ["contractValue", "Contract value"],
                ["startDate", "Start date", "date"],
                ["billingEmail", "Billing email"],
                ["notes", "Internal notes", "textarea"],
                ["address", "Address", "textarea"],
              ] as const
            ).map(([field, label, kind]) => (
              <div key={field}>
                <Label>{label}</Label>
                {kind === "textarea" ? (
                  <textarea
                    className="mt-1 min-h-[60px] w-full rounded-lg border border-white/10 bg-black/50 p-2 text-sm"
                    value={addForm[field as keyof typeof addForm] as string}
                    onChange={(e) => setAddForm({ ...addForm, [field]: e.target.value })}
                  />
                ) : (
                  <Input
                    type={kind === "date" ? "date" : "text"}
                    className="mt-1 border-white/10 bg-black/50"
                    value={addForm[field as keyof typeof addForm] as string}
                    onChange={(e) => setAddForm({ ...addForm, [field]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div>
              <Label>Status</Label>
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-2"
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="CHURNED">CHURNED</option>
                <option value="PAUSED">PAUSED</option>
              </select>
            </div>
            <div>
              <Label>Health score</Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="mt-1 border-white/10 bg-black/50"
                value={addForm.healthScore}
                onChange={(e) => setAddForm({ ...addForm, healthScore: e.target.value })}
              />
            </div>
            <div>
              <Label>Account manager</Label>
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-2"
                value={addForm.assignedToId}
                onChange={(e) => setAddForm({ ...addForm, assignedToId: e.target.value })}
              >
                <option value="">None</option>
                {team.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
              onClick={() => void addClient()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
