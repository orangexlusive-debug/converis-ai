"use client";

import { cn } from "@/lib/utils";

export function riskTextClass(score: number): string {
  if (score >= 66) return "text-red-400";
  if (score >= 33) return "text-amber-300";
  return "text-emerald-300";
}

export function riskClasses(score: number): string {
  if (score >= 66) return "text-red-400 bg-red-500/10 ring-red-500/20";
  if (score >= 33) return "text-amber-300 bg-amber-500/10 ring-amber-500/20";
  return "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20";
}

export function RiskBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ring-1",
        riskClasses(score)
      )}
    >
      {Math.round(score)}
    </span>
  );
}
