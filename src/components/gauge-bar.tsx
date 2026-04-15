"use client";

import { cn } from "@/lib/utils";

export function GaugeBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-cyan-500/15",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 transition-all duration-500 ease-out shadow-[0_0_12px_-2px_rgba(56,189,248,0.35)]"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
