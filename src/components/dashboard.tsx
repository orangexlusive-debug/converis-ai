"use client";

import { AnalysisDetail } from "@/components/analysis-detail";
import { ConnectionSettings } from "@/components/connection-popover";
import { CreateDealModal } from "@/components/create-deal-modal";
import { DealsGrid } from "@/components/deals-grid";
import { IndustrySidebar } from "@/components/industry-sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { labelsForBankingBusinessTypeIds } from "@/lib/banking-business-types";
import { labelsForHealthcareBusinessTypeIds } from "@/lib/healthcare-business-types";
import { labelsForTechBusinessTypeIds } from "@/lib/technology-business-types";
import { useDeals } from "@/providers/deals-provider";
import { SparklesIcon } from "lucide-react";
import { useMemo, useState } from "react";

export function Dashboard() {
  const [createOpen, setCreateOpen] = useState(false);
  const { deals, selectedDealId } = useDeals();

  const selected = useMemo(
    () => deals.find((d) => d.id === selectedDealId) ?? null,
    [deals, selectedDealId]
  );

  return (
    <div className="relative isolate flex h-screen min-h-0 flex-col bg-black text-foreground">
      <StarfieldCanvas className="absolute inset-0 z-0 h-full w-full" />

      <header className="relative z-10 shrink-0 border-b border-cyan-500/15 bg-black/55 backdrop-blur-xl supports-backdrop-filter:bg-black/40">
        <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 shadow-[0_0_24px_-4px_rgba(56,189,248,0.55)]">
              <SparklesIcon className="size-4 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-white">
                  Converis <span className="text-sky-300">AI</span>
                </h1>
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-sky-200/90 ring-1 ring-cyan-400/25">
                  100% Local PMI Platform
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionSettings />
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-4 text-white shadow-[0_0_28px_-6px_rgba(56,189,248,0.55)] transition hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500"
            >
              Create New Deal
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        <IndustrySidebar />

        <main className="relative min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-2 pb-8">
              <h2 className="text-2xl font-semibold tracking-tight">Integration Deals</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Manage post-merger integration projects with AI-powered analysis.
              </p>
            </div>

            <div className="space-y-3 pb-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  Saved deals
                </p>
              </div>
              <DealsGrid />
            </div>

            {selected && (
              <>
                <Separator className="my-8 bg-white/[0.06]" />
                <div className="space-y-4 pb-12">
                  <div>
                    <h3 className="text-lg font-medium tracking-tight">{selected.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Analysis output · {selected.industry}
                      {selected.technologyBusinessTypeIds &&
                        selected.technologyBusinessTypeIds.length > 0 && (
                          <>
                            {" "}
                            ·{" "}
                            <span className="text-foreground/80">
                              {labelsForTechBusinessTypeIds(selected.technologyBusinessTypeIds)}
                            </span>
                          </>
                        )}
                      {selected.bankingBusinessTypeIds &&
                        selected.bankingBusinessTypeIds.length > 0 && (
                          <>
                            {" "}
                            ·{" "}
                            <span className="text-foreground/80">
                              {labelsForBankingBusinessTypeIds(selected.bankingBusinessTypeIds)}
                            </span>
                          </>
                        )}
                      {selected.healthcareBusinessTypeIds &&
                        selected.healthcareBusinessTypeIds.length > 0 && (
                          <>
                            {" "}
                            ·{" "}
                            <span className="text-foreground/80">
                              {labelsForHealthcareBusinessTypeIds(selected.healthcareBusinessTypeIds)}
                            </span>
                          </>
                        )}
                    </p>
                  </div>

                  {selected.analysis ? (
                    <AnalysisDetail
                      parsed={selected.analysis.parsed}
                      rawResponse={selected.analysis.rawResponse}
                      parseError={selected.analysis.parseError}
                      model={selected.analysis.model}
                      analyzedAt={selected.analysis.analyzedAt}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No analysis stored for this deal yet.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        <ChatPanel />
      </div>

      <CreateDealModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
