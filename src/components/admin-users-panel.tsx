"use client";

import { StarfieldCanvas } from "@/components/starfield-canvas";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { useAppAuth } from "@/providers/app-auth-provider";
import { ArrowLeftIcon, Loader2Icon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function AdminUsersPanel() {
  const { user: currentUser, refresh } = useAppAuth();
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<SessionUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<SessionUser | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/users", { credentials: "include" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to load users.");
      return;
    }
    const data = (await res.json()) as { users: SessionUser[] };
    setUsers(data.users);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <div className="relative isolate min-h-screen bg-black text-foreground">
      <StarfieldCanvas className="absolute inset-0 z-0 h-full w-full" />

      <header className="relative z-10 shrink-0 border-b border-cyan-500/15 bg-black/55 backdrop-blur-xl supports-backdrop-filter:bg-black/40">
        <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              aria-label="Back to app"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "text-muted-foreground"
              )}
            >
              <ArrowLeftIcon className="size-4" />
            </Link>
            <h1 className="text-sm font-semibold tracking-tight text-white">User administration</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Users</h2>
            <p className="text-sm text-muted-foreground">
              Create, edit, or deactivate accounts. Signed in as{" "}
              {currentUser?.email ?? "—"}.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 text-white shadow-[0_0_24px_-6px_rgba(99,102,241,0.5)]"
          >
            <PlusIcon className="size-4" />
            Add user
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-cyan-500/15 bg-black/40 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2Icon className="mx-auto size-6 animate-spin opacity-60" />
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground/90">{u.email}</td>
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.role === "ADMIN"
                              ? "rounded-md bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200"
                              : "rounded-md bg-white/[0.06] px-2 py-0.5 text-xs"
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{u.active ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditUser(u)}
                            aria-label={`Edit ${u.email}`}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-400/90 hover:text-red-300"
                            disabled={u.id === currentUser?.id}
                            onClick={() => setDeleteUser(u)}
                            aria-label={`Delete ${u.email}`}
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add user"
        onSaved={async () => {
          await load();
          await refresh();
          setCreateOpen(false);
        }}
      />

      {editUser && (
        <UserFormDialog
          open={Boolean(editUser)}
          onOpenChange={(o) => !o && setEditUser(null)}
          title="Edit user"
          initial={editUser}
          onSaved={async () => {
            await load();
            await refresh();
            setEditUser(null);
          }}
        />
      )}

      <ConfirmDeleteDialog
        user={deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
        onDeleted={async () => {
          await load();
          await refresh();
          setDeleteUser(null);
        }}
      />
    </div>
  );
}

function UserFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial?: SessionUser | null;
  onSaved: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmail(initial?.email ?? "");
      setName(initial?.name ?? "");
      setPassword("");
      setRole(initial?.role ?? "USER");
      setActive(initial?.active ?? true);
      setFormError(null);
    }
  }, [open, initial]);

  async function submit() {
    setFormError(null);
    setSaving(true);
    try {
      if (initial) {
        const body: Record<string, unknown> = {
          email,
          name,
          role,
          active,
        };
        if (password.trim()) body.password = password;
        const res = await fetch(`/api/admin/users/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setFormError(data.error ?? "Update failed.");
          return;
        }
      } else {
        if (!password.trim()) {
          setFormError("Password is required for new users.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, name, role, active }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setFormError(data.error ?? "Create failed.");
          return;
        }
      }
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {formError && (
            <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="u-email">Email</Label>
            <Input
              id="u-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="border-white/10 bg-black/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-name">Name</Label>
            <Input
              id="u-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-white/10 bg-black/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-pass">
              Password {initial ? "(leave blank to keep)" : ""}
            </Label>
            <Input
              id="u-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className="border-white/10 bg-black/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-role">Role</Label>
            <select
              id="u-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
              className="flex h-9 w-full rounded-lg border border-white/10 bg-black/50 px-3 text-sm outline-none focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/30"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 rounded border-white/20 bg-black/50"
            />
            Active
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="bg-gradient-to-r from-sky-500 to-violet-600 text-white"
          >
            {saving ? <Loader2Icon className="size-4 animate-spin" /> : initial ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  user,
  onOpenChange,
  onDeleted,
}: {
  user: SessionUser | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    if (!user) return;
    setErr(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Delete failed.");
        return;
      }
      await onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete user?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will permanently remove{" "}
          <span className="font-mono text-foreground">{user?.email}</span>.
        </p>
        {err && (
          <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={() => void confirm()}
          >
            {deleting ? <Loader2Icon className="size-4 animate-spin" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
