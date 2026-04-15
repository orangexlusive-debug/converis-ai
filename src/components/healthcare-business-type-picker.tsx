"use client";

import { Label } from "@/components/ui/label";
import { HEALTHCARE_BUSINESS_TYPE_GROUPS } from "@/lib/healthcare-business-types";
import { cn } from "@/lib/utils";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function HealthcareBusinessTypePicker({ selectedIds, onChange }: Props) {
  const set = new Set(selectedIds);

  const toggle = (id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <div className="grid gap-3 rounded-xl border border-cyan-500/15 bg-black/40 p-3 ring-1 ring-cyan-500/10">
      <div>
        <Label className="text-sm">Healthcare business types</Label>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Select all that apply. Labels only here — full definitions are sent to your local model
          with the analysis request.
        </p>
      </div>
      <div className="max-h-56 space-y-4 overflow-y-auto pr-1">
        {HEALTHCARE_BUSINESS_TYPE_GROUPS.map((group) => (
          <div key={group.groupLabel} className="space-y-2">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              {group.groupLabel}
            </p>
            <ul className="space-y-1.5">
              {group.types.map((t) => {
                const checked = set.has(t.id);
                return (
                  <li key={t.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition-colors",
                        checked
                          ? "border-cyan-400/35 bg-sky-500/12 text-foreground"
                          : "border-white/[0.06] bg-black/20 text-muted-foreground hover:border-cyan-500/15 hover:bg-cyan-500/[0.04]"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-3.5 shrink-0 rounded border-white/20 accent-sky-500"
                        checked={checked}
                        onChange={() => toggle(t.id)}
                      />
                      <span className="leading-snug">{t.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
