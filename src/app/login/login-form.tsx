"use client";

import { ConverisLogoMark } from "@/components/converis-logo-mark";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (cancelled) return;
      if (res.ok) {
        router.replace("/app");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }
      const next = searchParams.get("redirect");
      router.replace(next && next.startsWith("/") ? next : "/app");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12">
      <StarfieldCanvas className="absolute inset-0 z-0 h-full w-full" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 shadow-[0_0_80px_-20px_rgba(99,102,241,0.35)] backdrop-blur-2xl supports-backdrop-filter:bg-black/25">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex items-center justify-center">
              <ConverisLogoMark size={72} priority className="drop-shadow-[0_0_28px_rgba(99,102,241,0.45)]" />
            </div>
            <h1 className="bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              CONVERIS AI
            </h1>
            <p className="mt-2 text-sm font-medium tracking-wide text-violet-200/75">
              M&amp;A Integration Intelligence
            </p>
          </div>

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-white/10 bg-black/50 text-foreground placeholder:text-muted-foreground focus-visible:border-violet-500 focus-visible:ring-violet-500/30 dark:focus-visible:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 border-white/10 bg-black/50 text-foreground placeholder:text-muted-foreground focus-visible:border-violet-500 focus-visible:ring-violet-500/30 dark:focus-visible:border-violet-500"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 text-base font-semibold text-white shadow-[0_0_32px_-6px_rgba(99,102,241,0.6)] transition hover:from-sky-400 hover:via-blue-500 hover:to-violet-500 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link
              href="/"
              className="text-sky-400/90 underline-offset-4 transition hover:text-sky-300 hover:underline"
            >
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
