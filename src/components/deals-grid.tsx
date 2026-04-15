"use client";

import { GaugeBar } from "@/components/gauge-bar";
import { RiskBadge } from "@/components/risk-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { labelsForBankingBusinessTypeIds } from "@/lib/banking-business-types";
import { labelsForHealthcareBusinessTypeIds } from "@/lib/healthcare-business-types";
import { labelsForTechBusinessTypeIds } from "@/lib/technology-business-types";
import type { Deal } from "@/lib/types/deal";
import { cn } from "@/lib/utils";
import { useDeals } from "@/providers/deals-provider";

function metrics(deal: Deal) {
  const parsed = deal.analysis?.parsed;
  const risk = parsed?.cultureRetentionRiskScore ?? null;
  const gauges = parsed?.successRateGauges;
  const progress =
    gauges && gauges.length > 0
      ? gauges.reduce((a, g) => a + (Number(g.value) || 0), 0) / gauges.length
      : 0;
  return { risk, progress };
}

export function DealsGrid() {
  const { deals, selectedIndustry, selectedDealId, setSelectedDealId } = useDeals();

  const filtered = deals.filter((d) => d.industry === selectedIndustry);

  if (filtered.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground/90">No deals in this industry yet</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Create a new deal with PDFs for{" "}
          <span className="text-foreground/80">{selectedIndustry}</span>, or switch industries in the
          sidebar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((deal) => {
        const active = deal.id === selectedDealId;
        const { risk, progress } = metrics(deal);
        return (
          <button
            key={deal.id}
            type="button"
            onClick={() => setSelectedDealId(deal.id)}
            className={cn(
              "text-left transition-all duration-200",
              active && "ring-2 ring-cyan-400/35"
            )}
          >
            <Card
              className={cn(
                "h-full border-white/[0.06] bg-white/[0.02] shadow-none ring-1 ring-white/[0.04] transition hover:bg-white/[0.04]",
                active && "bg-gradient-to-br from-sky-500/12 via-transparent to-indigo-600/10"
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2 text-base">{deal.name}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <span>{deal.industry}</span>
                  {deal.analysis ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-500/20">
                      Analyzed
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground ring-1 ring-white/10">
                      Pending
                    </span>
                  )}
                </CardDescription>
                {deal.technologyBusinessTypeIds && deal.technologyBusinessTypeIds.length > 0 && (
                  <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {labelsForTechBusinessTypeIds(deal.technologyBusinessTypeIds)}
                  </p>
                )}
                {deal.bankingBusinessTypeIds && deal.bankingBusinessTypeIds.length > 0 && (
                  <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {labelsForBankingBusinessTypeIds(deal.bankingBusinessTypeIds)}
                  </p>
                )}
                {deal.healthcareBusinessTypeIds && deal.healthcareBusinessTypeIds.length > 0 && (
                  <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {labelsForHealthcareBusinessTypeIds(deal.healthcareBusinessTypeIds)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Success outlook (avg. gauges)</span>
                    <span className="tabular-nums">{Math.round(progress)}%</span>
                  </div>
                  <GaugeBar value={progress} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Culture risk</span>
                  {risk !== null ? (
                    <RiskBadge score={risk} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
