"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Member = {
  id: string;
  email: string;
  name: string;
  role: string;
  clientsAssigned: number;
  demosThisMonth: number;
  revenueManaged: number;
};

type DemoRow = {
  id: string;
  company: string;
  name: string;
  status: string;
  assignedTo: { id: string; name: string } | null;
};

export function CrmTeamPage() {
  const [team, setTeam] = useState<Member[]>([]);
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "USER" });

  const load = useCallback(async () => {
    const res = await fetch("/api/crm/team", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { team: Member[] };
    setTeam(data.team);
  }, []);

  const loadDemos = useCallback(async () => {
    const res = await fetch("/api/crm/demos", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { demos: DemoRow[] };
    setDemos(data.demos.slice(0, 30));
  }, []);

  useEffect(() => {
    void load();
    void loadDemos();
  }, [load, loadDemos]);

  async function createUser() {
    const res = await fetch("/api/crm/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: form.email,
        name: form.name,
        password: form.password,
        role: form.role,
      }),
    });
    if (res.ok) {
      setOpen(false);
      setForm({ email: "", name: "", password: "", role: "USER" });
      void load();
    }
  }

  async function assignDemo(demoId: string, assignedToId: string | null) {
    await fetch(`/api/crm/demos/${demoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ assignedToId }),
    });
    void loadDemos();
    void load();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Team</h1>
          <p className="text-sm text-muted-foreground">Performance, assignments, and new Converis AI accounts.</p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="size-4" />
          Add team member
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs text-muted-foreground uppercase">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Clients</th>
                <th className="px-3 py-3">Demos (mo)</th>
                <th className="px-3 py-3">Revenue managed</th>
                <th className="px-3 py-3">Commission</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id} className="border-b border-white/[0.04]">
                  <td className="px-3 py-2 font-medium text-white">{m.name}</td>
                  <td className="px-3 py-2 text-xs">{m.role}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{m.email}</td>
                  <td className="px-3 py-2">{m.clientsAssigned}</td>
                  <td className="px-3 py-2">{m.demosThisMonth}</td>
                  <td className="px-3 py-2">${Math.round(m.revenueManaged).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-2 text-lg font-semibold text-white">Assign demo requests</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Route inbound demos to the right owner. Client assignment is managed from each client profile.
        </p>
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-muted-foreground uppercase">
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Assign to</th>
                </tr>
              </thead>
              <tbody>
                {demos.map((d) => (
                  <tr key={d.id} className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-white">{d.company}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{d.name}</td>
                    <td className="px-3 py-2 text-xs">{d.status}</td>
                    <td className="px-3 py-2">
                      <select
                        className="h-8 rounded border border-white/10 bg-black/50 px-2 text-xs"
                        value={d.assignedTo?.id ?? ""}
                        onChange={(e) =>
                          void assignDemo(d.id, e.target.value ? e.target.value : null)
                        }
                      >
                        <option value="">Unassigned</option>
                        {team.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New team member</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Creates a Converis AI login. Share credentials securely with the teammate.
          </p>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1 border-white/10 bg-black/50"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                className="mt-1 border-white/10 bg-black/50"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Temporary password</Label>
              <Input
                className="mt-1 border-white/10 bg-black/50"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-2"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
              onClick={() => void createUser()}
            >
              Create login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
