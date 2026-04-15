"use client";

import { GaugeBar } from "@/components/gauge-bar";
import { RiskBadge, riskTextClass } from "@/components/risk-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ParsedAnalysis } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
      >
        <h3 className="text-sm font-medium tracking-tight">{title}</h3>
        <ChevronDownIcon
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <>
          <Separator className="bg-white/[0.06]" />
          <div className="px-4 py-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </>
      )}
    </section>
  );
}

export function AnalysisDetail({
  parsed,
  rawResponse,
  parseError,
  model,
  analyzedAt,
}: {
  parsed: ParsedAnalysis | null;
  rawResponse: string;
  parseError?: string;
  model: string;
  analyzedAt: string;
}) {
  if (!parsed) {
    return (
      <div className="space-y-4">
        {parseError && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {parseError}
          </p>
        )}
        <Card className="border-white/[0.06] bg-black/20">
          <CardHeader>
            <CardTitle className="text-base">Raw model output</CardTitle>
            <CardDescription>
              Model: {model} · {new Date(analyzedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-xs text-foreground/90 ring-1 ring-white/10">
              {rawResponse || "(empty response)"}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  const risk = parsed.cultureRetentionRiskScore;

  return (
    <div className="space-y-4">
      {parseError && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {parseError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          Model: <span className="text-foreground/80">{model}</span>
        </span>
        <span>{new Date(analyzedAt).toLocaleString()}</span>
      </div>

      <Section title="Executive summary">
        <p className="text-foreground/90">{parsed.executiveSummary}</p>
      </Section>

      <Card className="border-cyan-500/10 bg-gradient-to-br from-sky-500/12 via-transparent to-indigo-600/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Culture &amp; retention risk</CardTitle>
          <CardDescription>0–100 (higher indicates more risk)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-4xl font-semibold tabular-nums tracking-tight",
                riskTextClass(risk)
              )}
            >
              {Math.round(risk)}
            </span>
            <RiskBadge score={risk} />
          </div>
          <GaugeBar value={risk} />
        </CardContent>
      </Card>

      <Section title="Synergies &amp; value leakage">
        <p className="text-foreground/90">{parsed.synergiesValueLeakage}</p>
      </Section>

      <Section title="18-month integration timeline">
        <ol className="space-y-4">
          {parsed.integrationTimeline18Month.map((phase, i) => {
            const label = typeof phase?.phase === "string" ? phase.phase : `Phase ${i + 1}`;
            const range = typeof phase?.monthRange === "string" ? phase.monthRange : "";
            const milestones = Array.isArray(phase?.milestones)
              ? phase.milestones.filter((m): m is string => typeof m === "string")
              : [];
            return (
              <li key={`${label}-${i}`} className="rounded-lg bg-black/30 p-3 ring-1 ring-white/[0.06]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-foreground">{label}</span>
                  {range ? (
                    <span className="text-xs text-muted-foreground">{range}</span>
                  ) : null}
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {milestones.map((m, j) => (
                    <li key={j}>{m}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section title="Success rate gauges">
        <div className="space-y-4">
          {parsed.successRateGauges
            .filter((g): g is { label: string; value: number } => {
              return typeof g?.label === "string" && typeof g?.value === "number";
            })
            .map((g, i) => (
              <div key={`${g.label}-${i}`}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-foreground/90">{g.label}</span>
                  <span className="tabular-nums text-muted-foreground">{Math.round(g.value)}%</span>
                </div>
                <GaugeBar value={g.value} />
              </div>
            ))}
        </div>
      </Section>

      <Section title="Failure points">
        <ul className="list-disc space-y-2 pl-5">
          {parsed.failurePoints
            .filter((f): f is string => typeof f === "string")
            .map((f, i) => (
              <li key={i}>{f}</li>
            ))}
        </ul>
      </Section>

      <Section title="Training &amp; onboarding suggestions">
        <ul className="list-disc space-y-2 pl-5">
          {parsed.trainingOnboardingSuggestions
            .filter((f): f is string => typeof f === "string")
            .map((f, i) => (
              <li key={i}>{f}</li>
            ))}
        </ul>
      </Section>

      <details className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Raw model output</summary>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-foreground/80">
          {rawResponse}
        </pre>
      </details>
    </div>
  );
}
