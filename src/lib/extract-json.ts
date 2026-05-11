import type {
  CrossFunctionalWorkstream,
  DepartmentMergerPlan,
  FailurePointDetail,
  IntegrationTimelinePhase,
  ParsedAnalysis,
  SuccessGauge,
  TrainingAudiencePlan,
} from "./types/analysis";

/**
 * Pull JSON object from model output (handles optional ```json fences).
 * Returns null if no valid object found.
 */
export function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.round(Math.max(0, Math.min(100, n)));
}

function parseGauges(v: unknown): SuccessGauge[] {
  if (!Array.isArray(v)) return [];
  const out: SuccessGauge[] = [];
  for (const g of v) {
    if (!g || typeof g !== "object") continue;
    const rec = g as Record<string, unknown>;
    const label = str(rec.label);
    const valueRaw = rec.value;
    if (!label || typeof valueRaw !== "number" || !Number.isFinite(valueRaw)) continue;
    out.push({ label, value: clampScore(valueRaw) });
  }
  return out;
}

function parsePhaseEntry(p: unknown): IntegrationTimelinePhase | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const phaseName = str(o.phase);
  const monthRange = str(o.monthRange);
  let objectives = str(o.objectives);
  let milestones = strings(o.milestones);
  let actionableSteps = strings(o.actionableSteps);
  if (actionableSteps.length === 0) actionableSteps = milestones.length ? [...milestones] : [];
  const decisionGateList = strings(o.decisionGates);
  const phase = phaseName || "Integration phase";

  if (actionableSteps.length === 0) return null;
  if (milestones.length === 0) milestones = actionableSteps.slice(0, Math.min(6, actionableSteps.length));
  if (!objectives) {
    objectives =
      "Execute the phased actions below while confirming assumptions against cited buyer/seller materials and diligence — do not invent scope or timelines not evidenced.";
  }
  const base: IntegrationTimelinePhase = {
    phase,
    monthRange,
    objectives,
    milestones,
    actionableSteps,
  };
  if (decisionGateList.length > 0) base.decisionGates = decisionGateList;
  return base;
}

function parsePhases(v: unknown): IntegrationTimelinePhase[] {
  if (!Array.isArray(v)) return [];
  return v.map(parsePhaseEntry).filter((x): x is IntegrationTimelinePhase => x !== null);
}

function parseFailureDetails(v: unknown): FailurePointDetail[] {
  if (!Array.isArray(v)) return [];
  const out: FailurePointDetail[] = [];
  for (const row of v) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const title = str(r.title);
    const earlyWarningSignals = strings(r.earlyWarningSignals);
    const mitigationSteps = strings(r.mitigationSteps);
    if (!title) continue;
    out.push({
      title,
      earlyWarningSignals,
      mitigationSteps,
    });
  }
  return out;
}

function parseWorkstreams(v: unknown): CrossFunctionalWorkstream[] {
  if (!Array.isArray(v)) return [];
  const out: CrossFunctionalWorkstream[] = [];
  for (const w of v) {
    if (!w || typeof w !== "object") continue;
    const o = w as Record<string, unknown>;
    const name = str(o.name);
    let purpose = str(o.purpose);
    const keyActivities = strings(o.keyActivities);
    const dependencies = strings(o.dependencies);
    if (!name) continue;
    if (!purpose && keyActivities.length > 0) {
      purpose =
        "Purpose was not spelled out in model output — align this stream's mandate with IMO charter and diligence findings.";
    }
    if (!purpose) continue;
    out.push({
      name,
      purpose,
      keyActivities,
      dependencies,
    });
  }
  return out;
}

function parseTrainingPlans(v: unknown): TrainingAudiencePlan[] {
  if (!Array.isArray(v)) return [];
  const out: TrainingAudiencePlan[] = [];
  for (const row of v) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const audience = str(r.audience);
    if (!audience) continue;
    let sequencing = str(r.sequencing);
    if (!sequencing) {
      sequencing =
        "Sequence after steering validates operating-model assumptions and disclosures allow employee-facing comms.";
    }
    out.push({
      audience,
      learningObjectives: strings(r.learningObjectives),
      modalities: strings(r.modalities),
      curriculumTopics: strings(r.curriculumTopics),
      sequencing,
      competencyChecks: strings(r.competencyChecks),
    });
  }
  return out;
}

function parseDepartmentMergerPlans(v: unknown): DepartmentMergerPlan[] {
  if (!Array.isArray(v)) return [];
  const out: DepartmentMergerPlan[] = [];
  for (const row of v) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const department = str(r.department);
    const mandate = str(r.mandate);
    if (!department || !mandate) continue;
    out.push({
      department,
      mandate,
      priorityTasks: strings(r.priorityTasks),
      coordinatesWith: strings(r.coordinatesWith),
      readinessChecks: strings(r.readinessChecks),
    });
  }
  return out;
}

const LEGACY_HINT =
  "This record predates richer analysis fields — re-run **Analyze** to populate narratives and playbooks structured for tabs.";

/**
 * Validates and normalizes model JSON into `ParsedAnalysis`.
 * Supports legacy payloads that used string lists for failures / training bullets.
 */
export function coerceParsedAnalysis(v: unknown): ParsedAnalysis | null {
  if (!v || typeof v !== "object") return null;
  const raw = v as Record<string, unknown>;

  const executiveSummary = str(raw.executiveSummary);
  if (!executiveSummary) return null;

  const crsRaw = raw.cultureRetentionRiskScore;
  const cultureRetentionRiskScore = typeof crsRaw === "number" ? clampScore(crsRaw) : NaN;
  if (!Number.isFinite(cultureRetentionRiskScore)) return null;

  const synergiesValueLeakage = str(raw.synergiesValueLeakage);
  if (!synergiesValueLeakage) return null;

  const phases = parsePhases(raw.integrationTimeline18Month);
  if (phases.length === 0) return null;

  const gauges = parseGauges(raw.successRateGauges);
  if (gauges.length === 0) return null;

  const executiveKeyDecisionsNeeded = strings(raw.executiveKeyDecisionsNeeded);

  let cultureRetentionNarrative = str(raw.cultureRetentionNarrative);
  const culturalIntegrationRoadmap = strings(raw.culturalIntegrationRoadmap);
  const synergyCaptureSteps = strings(raw.synergyCaptureSteps);
  const valueLeakagePrevention = strings(raw.valueLeakagePrevention);
  let failurePointDetails = parseFailureDetails(raw.failurePointDetails);
  const crossFunctionalWorkstreams = parseWorkstreams(raw.crossFunctionalWorkstreams);
  let trainingAudiencePlans = parseTrainingPlans(raw.trainingAudiencePlans);
  const onboardingSystemsChecklist = strings(raw.onboardingSystemsChecklist);
  const communicationsCadence = strings(raw.communicationsCadence);
  const evidenceGapsAndDiligenceQuestions = strings(raw.evidenceGapsAndDiligenceQuestions);

  const legacyFailureTitles = strings(raw.failurePoints);
  const legacyTrainingStrings = strings(raw.trainingOnboardingSuggestions);

  if (!cultureRetentionNarrative) {
    cultureRetentionNarrative = `${LEGACY_HINT} Interpret the culture/retention score strictly alongside excerpts and KB citations when present — avoid asserting unnamed survey results or undisclosed turnover statistics.`;
  }

  if (failurePointDetails.length === 0 && legacyFailureTitles.length > 0) {
    failurePointDetails = legacyFailureTitles.map((title) => ({
      title,
      earlyWarningSignals: [] as string[],
      mitigationSteps: [] as string[],
    }));
  }

  if (trainingAudiencePlans.length === 0 && legacyTrainingStrings.length > 0) {
    trainingAudiencePlans = [
      {
        audience: "Affected employee groups (segment per diligence)",
        learningObjectives: [
          "Execute role changes only where evidenced; escalate unknown workflows instead of improvising commitments.",
        ],
        modalities: ["Live sessions plus reinforcement channels as capacity allows"],
        curriculumTopics: legacyTrainingStrings,
        sequencing: "After managers receive confirmed operating-model guidance from steering.",
        competencyChecks: ["Confirm understanding of documented policies referenced in source packs"],
      },
    ];
  }

  let recommendedMergerProceeding = str(raw.recommendedMergerProceeding);
  if (!recommendedMergerProceeding) {
    recommendedMergerProceeding = `${LEGACY_HINT} Re-run analysis for merger proceeding recommendations keyed to buyer/seller excerpts.`;
  }
  const mergerSuccessFactors = strings(raw.mergerSuccessFactors);
  const programLevelStepByStep = strings(raw.programLevelStepByStep);
  const departmentMergerPlans = parseDepartmentMergerPlans(raw.departmentMergerPlans);

  return {
    executiveSummary,
    executiveKeyDecisionsNeeded,
    cultureRetentionRiskScore,
    cultureRetentionNarrative,
    culturalIntegrationRoadmap,
    synergiesValueLeakage,
    synergyCaptureSteps,
    valueLeakagePrevention,
    integrationTimeline18Month: phases,
    crossFunctionalWorkstreams,
    successRateGauges: gauges,
    failurePointDetails,
    trainingAudiencePlans,
    onboardingSystemsChecklist,
    communicationsCadence,
    evidenceGapsAndDiligenceQuestions,
    recommendedMergerProceeding,
    mergerSuccessFactors,
    programLevelStepByStep,
    departmentMergerPlans,
  };
}

/** Returns true when `coerceParsedAnalysis` can build a display-ready analysis object. */
export function isParsedAnalysis(v: unknown): boolean {
  return coerceParsedAnalysis(v) !== null;
}
