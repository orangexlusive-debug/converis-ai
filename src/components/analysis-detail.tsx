"use client";

import type { ReactNode } from "react";

import {
  AnalysisHealthSnapshotChart,
  CultureRetentionRiskChart,
  DepartmentTaskLoadChart,
  FailureSignalsChart,
  IntegrationPhaseWorkloadChart,
  ProgramHealthGaugesChart,
} from "@/components/analysis-charts";
import { GaugeBar } from "@/components/gauge-bar";
import { RiskBadge, riskTextClass } from "@/components/risk-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { coerceParsedAnalysis } from "@/lib/extract-json";
import type { ParsedAnalysis } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";
import { useAppAuth } from "@/providers/app-auth-provider";

function Prose({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-muted-foreground", className)}>
      {children}
    </div>
  );
}

function Ol({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ol
      className={cn("list-decimal space-y-2 pl-5 marker:text-cyan-400/80", className)}
    >
      {children}
    </ol>
  );
}

function Li({ children }: { children: ReactNode }) {
  return <li className="text-foreground/90">{children}</li>;
}

function Ul({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ul
      className={cn("list-disc space-y-1.5 pl-5 marker:text-cyan-400/60", className)}
    >
      {children}
    </ul>
  );
}

function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-xs text-muted-foreground">
      {children}
    </p>
  );
}

function AnalysisRunMeta({
  analyzedAt,
  model,
  showModel,
}: {
  analyzedAt: string;
  model: string;
  showModel: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      {showModel ?
        <span>
          Inference model: <span className="text-foreground/80">{model}</span>
        </span>
      : <span>Analysis run</span>}
      <span>{new Date(analyzedAt).toLocaleString()}</span>
    </div>
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
  const { user } = useAppAuth();
  const showModel = user?.role === "ADMIN";

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
              {showModel ? `Inference model: ${model} · ` : ""}
              {new Date(analyzedAt).toLocaleString()}
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

  /** Saved deals may predate the expanded schema; always coerce so array fields exist. */
  const analysis = coerceParsedAnalysis(parsed as unknown);
  if (!analysis) {
    return (
      <div className="space-y-4">
        {parseError && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {parseError}
          </p>
        )}
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          This saved analysis is missing required fields (for example timeline phases or gauges). Re-run
          analysis on the deal, or see raw output below.
        </p>
        <Card className="border-white/[0.06] bg-black/20">
          <CardHeader>
            <CardTitle className="text-base">Raw model output</CardTitle>
            <CardDescription>
              {showModel ? `Inference model: ${model} · ` : ""}
              {new Date(analyzedAt).toLocaleString()}
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

  const risk = analysis.cultureRetentionRiskScore;

  return (
    <div className="space-y-4">
      {parseError && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {parseError}
        </p>
      )}

      <AnalysisRunMeta analyzedAt={analyzedAt} model={model} showModel={showModel} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roadmap">Merger roadmap</TabsTrigger>
          <TabsTrigger value="culture">Culture &amp; retention</TabsTrigger>
          <TabsTrigger value="synergies">Synergies &amp; leakage</TabsTrigger>
          <TabsTrigger value="timeline">18-month playbook</TabsTrigger>
          <TabsTrigger value="training">Training &amp; onboarding</TabsTrigger>
          <TabsTrigger value="failures">Failure modes</TabsTrigger>
          <TabsTrigger value="gauges">Program health</TabsTrigger>
          <TabsTrigger value="diligence">Diligence gaps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <AnalysisHealthSnapshotChart risk={risk} gauges={analysis.successRateGauges ?? []} />
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Executive summary</CardTitle>
              <CardDescription>Source-grounded narrative; hedge where documents are silent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Prose>
                <p className="whitespace-pre-wrap text-foreground/90">{analysis.executiveSummary}</p>
              </Prose>

              <div>
                <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Steering decisions needed
                </h4>
                {(analysis.executiveKeyDecisionsNeeded ?? []).length === 0 ? (
                  <EmptyHint>No steering decisions listed — expand analysis or add diligence packs.</EmptyHint>
                ) : (
                  <Ol>
                    {(analysis.executiveKeyDecisionsNeeded ?? []).map((item, i) => (
                      <Li key={`${i}-${item.slice(0, 48)}`}>{item}</Li>
                    ))}
                  </Ol>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4 space-y-4">
          <DepartmentTaskLoadChart plans={analysis.departmentMergerPlans ?? []} />
          <Card className="border-emerald-500/15 bg-emerald-500/[0.04] ring-1 ring-emerald-500/10">
            <CardHeader>
              <CardTitle className="text-base">How to proceed (recommendations)</CardTitle>
              <CardDescription>
                Advisory sequencing for steering — specific deal claims should trace to uploads/KB;
                hedge with diligence where sources are incomplete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {analysis.recommendedMergerProceeding}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm">Factors that materially improve PMI success</CardTitle>
                <CardDescription>Qualitative signals and patterns — validate against your dossier.</CardDescription>
              </CardHeader>
              <CardContent>
                {(analysis.mergerSuccessFactors ?? []).length === 0 ?
                  <EmptyHint>No success factors listed — rerun analysis.</EmptyHint>
                : <Ul className="text-xs leading-relaxed text-foreground/90">
                    {(analysis.mergerSuccessFactors ?? []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </Ul>
                }
              </CardContent>
            </Card>
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm">Program-level sequence</CardTitle>
                <CardDescription>Ordered “chapters”; pair with the 18-month playbook tab for phase detail.</CardDescription>
              </CardHeader>
              <CardContent>
                {(analysis.programLevelStepByStep ?? []).length === 0 ?
                  <EmptyHint>No program-level steps listed — rerun analysis.</EmptyHint>
                : <Ol className="text-xs leading-relaxed">
                    {(analysis.programLevelStepByStep ?? []).map((x, i) => (
                      <Li key={`${i}-${x.slice(0, 48)}`}>{x}</Li>
                    ))}
                  </Ol>
                }
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Tasking by department / function</CardTitle>
              <CardDescription>
                Mirrors named org units only when evidenced; neutral PMI pillars otherwise — adjust titles to match
                your chart.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {(analysis.departmentMergerPlans ?? []).length === 0 ?
                <EmptyHint>No departmental plans listed — rerun analysis.</EmptyHint>
              : (analysis.departmentMergerPlans ?? []).map((d, i) => (
                  <div
                    key={`${d.department}-${i}`}
                    className="rounded-xl border border-cyan-500/12 bg-black/35 p-4 ring-1 ring-cyan-500/10"
                  >
                    <p className="text-sm font-semibold text-foreground">{d.department}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d.mandate}</p>
                    <Separator className="my-4 bg-white/[0.06]" />
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-sky-200/85">
                          Priority tasks
                        </p>
                        {(d.priorityTasks ?? []).length === 0 ?
                          <p className="text-xs text-muted-foreground">—</p>
                        : <Ol className="space-y-1 text-xs leading-relaxed">
                            {(d.priorityTasks ?? []).map((t, j) => (
                              <li key={j} className="text-foreground/90">
                                {t}
                              </li>
                            ))}
                          </Ol>
                        }
                      </div>
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-violet-200/80">
                          Coordinates with
                        </p>
                        {(d.coordinatesWith ?? []).length === 0 ?
                          <p className="text-xs text-muted-foreground">—</p>
                        : <Ul className="space-y-1 text-xs leading-relaxed">
                            {(d.coordinatesWith ?? []).map((t, j) => (
                              <li key={j}>{t}</li>
                            ))}
                          </Ul>
                        }
                      </div>
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/80">
                          Readiness checks
                        </p>
                        {(d.readinessChecks ?? []).length === 0 ?
                          <p className="text-xs text-muted-foreground">—</p>
                        : <Ul className="space-y-1 text-xs leading-relaxed">
                            {(d.readinessChecks ?? []).map((t, j) => (
                              <li key={j}>{t}</li>
                            ))}
                          </Ul>
                        }
                      </div>
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="culture" className="mt-4 space-y-4">
          <Card className="border-cyan-500/10 bg-gradient-to-br from-sky-500/12 via-transparent to-indigo-600/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Culture &amp; retention risk index</CardTitle>
              <CardDescription>0–100 (higher = more inherent risk signals in sources)</CardDescription>
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

          <CultureRetentionRiskChart risk={risk} />

          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Cultural commentary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {analysis.cultureRetentionNarrative}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Integration roadmap — people &amp; culture</CardTitle>
              <CardDescription>Sequential steps (conditions called out within each line).</CardDescription>
            </CardHeader>
            <CardContent>
              {(analysis.culturalIntegrationRoadmap ?? []).length === 0 ? (
                <EmptyHint>Roadmap not populated — rerun analysis.</EmptyHint>
              ) : (
                <Ol>
                  {(analysis.culturalIntegrationRoadmap ?? []).map((step, i) => (
                    <Li key={`${i}-${step.slice(0, 48)}`}>{step}</Li>
                  ))}
                </Ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synergies" className="mt-4 space-y-4">
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Synergies &amp; leakage narrative</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {analysis.synergiesValueLeakage}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm">Synergy realization steps</CardTitle>
                <CardDescription>Validate each claim against cited diligence.</CardDescription>
              </CardHeader>
              <CardContent>
                {(analysis.synergyCaptureSteps ?? []).length === 0 ? (
                  <EmptyHint>No capture steps returned.</EmptyHint>
                ) : (
                  <Ol className="text-xs">
                    {(analysis.synergyCaptureSteps ?? []).map((s, i) => (
                      <Li key={`${i}-${s.slice(0, 32)}`}>{s}</Li>
                    ))}
                  </Ol>
                )}
              </CardContent>
            </Card>
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm">Value leakage prevention</CardTitle>
                <CardDescription>Guards grounded in excerpts or flagged as hypothetical.</CardDescription>
              </CardHeader>
              <CardContent>
                {(analysis.valueLeakagePrevention ?? []).length === 0 ? (
                  <EmptyHint>No leakage guards returned.</EmptyHint>
                ) : (
                  <Ol className="text-xs">
                    {(analysis.valueLeakagePrevention ?? []).map((s, i) => (
                      <Li key={`${i}-${s.slice(0, 32)}`}>{s}</Li>
                    ))}
                  </Ol>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 space-y-4">
          <IntegrationPhaseWorkloadChart phases={analysis.integrationTimeline18Month ?? []} />
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">18-month phased playbook</CardTitle>
              <CardDescription>Use milestones + steps as IMO-ready work breakdown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-5">
                {(analysis.integrationTimeline18Month ?? []).map((phase, i) => {
                  const label = typeof phase?.phase === "string" ? phase.phase : `Phase ${i + 1}`;
                  const range = typeof phase?.monthRange === "string" ? phase.monthRange : "";
                  const milestones = Array.isArray(phase?.milestones)
                    ? phase.milestones.filter((m): m is string => typeof m === "string")
                    : [];
                  const steps = Array.isArray(phase?.actionableSteps)
                    ? phase.actionableSteps.filter((m): m is string => typeof m === "string")
                    : [];
                  const gates =
                    phase.decisionGates?.filter((m): m is string => typeof m === "string") ?? [];
                  const objectives =
                    typeof phase?.objectives === "string" ? phase.objectives : "";

                  return (
                    <li
                      key={`${label}-${i}`}
                      className="rounded-xl border border-white/[0.07] bg-black/35 p-4 ring-1 ring-cyan-500/10"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium text-foreground">{label}</span>
                        {range ? (
                          <span className="text-xs text-muted-foreground">{range}</span>
                        ) : null}
                      </div>
                      {objectives ?
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground/85">Objectives:</span> {objectives}
                        </p>
                      : null}
                      <div className="mt-3 grid gap-4 lg:grid-cols-2">
                        <div>
                          <p className="mb-2 text-[11px] font-semibold tracking-wide text-cyan-200/85 uppercase">
                            Milestones
                          </p>
                          <Ul className="text-xs text-foreground/90">
                            {milestones.map((m, j) => (
                              <li key={j}>{m}</li>
                            ))}
                          </Ul>
                        </div>
                        <div>
                          <p className="mb-2 text-[11px] font-semibold tracking-wide text-sky-200/85 uppercase">
                            Decision gates
                          </p>
                          {gates.length === 0 ?
                            <p className="text-xs text-muted-foreground">—</p>
                          : <Ul className="text-xs text-foreground/90">
                              {gates.map((m, j) => (
                                <li key={j}>{m}</li>
                              ))}
                            </Ul>
                          }
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-semibold tracking-wide text-foreground/70 uppercase">
                          Actionable steps (sequential)
                        </p>
                        <Ol className="space-y-1.5 text-xs">
                          {steps.map((m, j) => (
                            <li key={j} className="text-foreground/90">
                              {m}
                            </li>
                          ))}
                        </Ol>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Cross-functional workstreams</CardTitle>
              <CardDescription>Charters aligned to the playbook — confirm owners in steering.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(analysis.crossFunctionalWorkstreams ?? []).length === 0 ?
                <EmptyHint>No workstreams returned — rerun analysis or add richer documents.</EmptyHint>
              : (analysis.crossFunctionalWorkstreams ?? []).map((ws, i) => (
                  <div
                    key={`${ws.name}-${i}`}
                    className="rounded-lg border border-white/[0.06] bg-black/25 p-4"
                  >
                    <p className="text-sm font-medium text-foreground">{ws.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ws.purpose}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                          Key activities
                        </p>
                        <Ul className="text-xs">
                          {(ws.keyActivities ?? []).map((a, j) => (
                            <li key={j}>{a}</li>
                          ))}
                        </Ul>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                          Dependencies
                        </p>
                        <Ul className="text-xs">
                          {(ws.dependencies ?? []).map((a, j) => (
                            <li key={j}>{a}</li>
                          ))}
                        </Ul>
                      </div>
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="mt-4 space-y-4">
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Learning &amp; enablement by audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {(analysis.trainingAudiencePlans ?? []).length === 0 ?
                <EmptyHint>No structured training plans — legacy bullets may need a fresh analysis run.</EmptyHint>
              : (analysis.trainingAudiencePlans ?? []).map((plan, i) => (
                  <div
                    key={`${plan.audience}-${i}`}
                    className="rounded-xl border border-white/[0.06] bg-black/28 p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{plan.audience}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="text-foreground/80">Sequence:</span> {plan.sequencing ?? ""}
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase text-sky-200/85">
                          Objectives
                        </p>
                        <Ul className="text-xs">
                          {(plan.learningObjectives ?? []).map((x, j) => (
                            <li key={j}>{x}</li>
                          ))}
                        </Ul>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase text-sky-200/85">
                          Modalities
                        </p>
                        <Ul className="text-xs">
                          {(plan.modalities ?? []).map((x, j) => (
                            <li key={j}>{x}</li>
                          ))}
                        </Ul>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                        Curriculum topics
                      </p>
                      <Ul className="text-xs">
                        {(plan.curriculumTopics ?? []).map((x, j) => (
                          <li key={j}>{x}</li>
                        ))}
                      </Ul>
                    </div>
                    <div className="mt-4">
                      <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                        Competency / verification
                      </p>
                      <Ul className="text-xs">
                        {(plan.competencyChecks ?? []).map((x, j) => (
                          <li key={j}>{x}</li>
                        ))}
                      </Ul>
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm">Systems &amp; access onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                {(analysis.onboardingSystemsChecklist ?? []).length === 0 ?
                  <EmptyHint>No checklist supplied.</EmptyHint>
                : <Ul className="text-xs leading-relaxed">
                    {(analysis.onboardingSystemsChecklist ?? []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </Ul>
                }
              </CardContent>
            </Card>
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm">Communications cadence</CardTitle>
              </CardHeader>
              <CardContent>
                {(analysis.communicationsCadence ?? []).length === 0 ?
                  <EmptyHint>No communications cadence supplied.</EmptyHint>
                : <Ul className="text-xs leading-relaxed">
                    {(analysis.communicationsCadence ?? []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </Ul>
                }
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="failures" className="mt-4 space-y-4">
          <FailureSignalsChart failures={analysis.failurePointDetails ?? []} />
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Failure modes &amp; mitigations</CardTitle>
              <CardDescription>Qualitative early warnings — not sourced metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(analysis.failurePointDetails ?? []).length === 0 ?
                <EmptyHint>No structured failure analysis — upload additional diligence or rerun.</EmptyHint>
              : (analysis.failurePointDetails ?? []).map((fp, i) => (
                  <div
                    key={`${fp.title}-${i}`}
                    className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4"
                  >
                    <p className="text-sm font-medium text-foreground">{fp.title}</p>
                    <Separator className="my-3 bg-white/[0.06]" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase text-amber-200/90">
                          Early warning signals
                        </p>
                        {(fp.earlyWarningSignals ?? []).length === 0 ?
                          <p className="text-xs text-muted-foreground">Not specified</p>
                        : <Ul className="text-xs">
                            {(fp.earlyWarningSignals ?? []).map((s, j) => (
                              <li key={j}>{s}</li>
                            ))}
                          </Ul>
                        }
                      </div>
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase text-emerald-200/85">
                          Mitigation steps
                        </p>
                        {(fp.mitigationSteps ?? []).length === 0 ?
                          <p className="text-xs text-muted-foreground">Not specified</p>
                        : <Ol className="text-xs">
                            {(fp.mitigationSteps ?? []).map((s, j) => (
                              <li key={j} className="text-foreground/90">
                                {s}
                              </li>
                            ))}
                          </Ol>
                        }
                      </div>
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gauges" className="mt-4 space-y-4">
          <ProgramHealthGaugesChart gauges={analysis.successRateGauges ?? []} />
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Program health indices</CardTitle>
              <CardDescription>Directional 0–100 estimates from source-grounded analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {(analysis.successRateGauges ?? [])
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diligence" className="mt-4">
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Evidence gaps &amp; diligence questions</CardTitle>
              <CardDescription>Replace speculation with requests for missing artifacts.</CardDescription>
            </CardHeader>
            <CardContent>
              {(analysis.evidenceGapsAndDiligenceQuestions ?? []).length === 0 ?
                <EmptyHint>No explicit gaps listed — confirm model output or add document packs.</EmptyHint>
              : <Ul className="text-sm leading-relaxed text-foreground/90">
                  {(analysis.evidenceGapsAndDiligenceQuestions ?? []).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </Ul>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <details className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Raw model output</summary>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-foreground/80">
          {rawResponse}
        </pre>
      </details>
    </div>
  );
}
