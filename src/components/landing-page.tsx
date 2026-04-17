"use client";

import { ConverisLogoMark } from "@/components/converis-logo-mark";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-black text-foreground">
      <StarfieldCanvas className="absolute inset-0 z-0 h-full w-full" />

      <header className="relative z-10 flex h-16 items-center justify-between border-b border-cyan-500/12 bg-black/50 px-4 backdrop-blur-xl supports-backdrop-filter:bg-black/35 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <ConverisLogoMark size={40} priority className="drop-shadow-[0_0_18px_rgba(56,189,248,0.4)]" />
          <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
            CONVERIS AI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="mailto:hello@converis.ai?subject=Converis%20AI%20demo%20request"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "border-violet-500/35 bg-white/[0.03] text-foreground shadow-[0_0_20px_-8px_rgba(139,92,246,0.35)] hover:border-violet-400/50 hover:bg-white/[0.06]"
            )}
          >
            Request Demo
          </a>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "default" }),
              "bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 px-5 text-white shadow-[0_0_28px_-6px_rgba(56,189,248,0.5)] transition hover:from-sky-400 hover:via-blue-500 hover:to-violet-500"
            )}
          >
            Login
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 pb-32 text-center">
        <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-violet-300/80 uppercase">
          M&amp;A Integration Intelligence
        </p>
        <h1 className="mb-6 max-w-3xl bg-gradient-to-br from-white via-sky-100 to-violet-200 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl md:text-6xl">
          Close the gap between deal thesis and integration reality.
        </h1>
        <p className="mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Converis AI runs entirely on your infrastructure—Ollama-powered analysis, document-grounded
          PMI insights, and a workspace built for operators who need precision without cloud
          leakage.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 px-8 text-white shadow-[0_0_36px_-8px_rgba(99,102,241,0.55)] transition hover:from-sky-400 hover:via-blue-500 hover:to-violet-500"
            )}
          >
            Sign in to platform
          </Link>
          <a
            href="mailto:hello@converis.ai?subject=Converis%20AI%20demo%20request"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-cyan-500/25 bg-white/[0.04] px-8 hover:bg-white/[0.08]"
            )}
          >
            Request a demo
          </a>
        </div>
      </main>
    </div>
  );
}
