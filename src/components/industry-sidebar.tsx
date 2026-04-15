"use client";

import { INDUSTRIES } from "@/lib/industries";
import { cn } from "@/lib/utils";
import { useDeals } from "@/providers/deals-provider";

export function IndustrySidebar() {
  const { selectedIndustry, setSelectedIndustry } = useDeals();

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-cyan-500/12 bg-black/60 backdrop-blur-xl supports-backdrop-filter:bg-black/45">
      <div className="border-b border-cyan-500/12 px-4 py-5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-sky-200/55">
          INDUSTRIES
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {INDUSTRIES.map((name) => {
          const active = selectedIndustry === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedIndustry(name)}
              className={cn(
                "group relative rounded-lg px-3 py-2 text-left text-sm transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-sky-500/18 via-blue-600/10 to-transparent text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.22)]"
                  : "text-muted-foreground hover:bg-cyan-500/[0.06] hover:text-foreground"
              )}
            >
              {active && (
                <span
                  className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-400 to-blue-600"
                  aria-hidden
                />
              )}
              <span className="relative block truncate">{name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
