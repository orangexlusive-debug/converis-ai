export interface IntegrationTimelinePhase {
  phase: string;
  monthRange: string;
  /** Grounded objectives for this horizon, or explicitly conditional / diligence-needed wording. */
  objectives: string;
  milestones: string[];
  /** Ordered operational steps teams should execute in this horizon (no fabricated dates/deal facts). */
  actionableSteps: string[];
  decisionGates?: string[];
}

export interface SuccessGauge {
  label: string;
  value: number;
}

/** Rich failure modes — narratives must avoid inventing metrics or deal facts not in sources. */
export interface FailurePointDetail {
  title: string;
  earlyWarningSignals: string[];
  mitigationSteps: string[];
}

export interface TrainingAudiencePlan {
  audience: string;
  learningObjectives: string[];
  modalities: string[];
  curriculumTopics: string[];
  sequencing: string;
  competencyChecks: string[];
}

export interface CrossFunctionalWorkstream {
  name: string;
  purpose: string;
  keyActivities: string[];
  dependencies: string[];
}

/**
 * Department / function-centric plan — labels must mirror org naming from sources when possible;
 * otherwise use explicit “typical PMI function area” disclaimers inside task text.
 */
export interface DepartmentMergerPlan {
  department: string;
  mandate: string;
  priorityTasks: string[];
  coordinatesWith: string[];
  readinessChecks: string[];
}

/**
 * PMI-style analysis returned as JSON from `/api/analyze`.
 * Older saved deals may be coerced via `coerceParsedAnalysis` in `@/lib/extract-json`.
 */
export interface ParsedAnalysis {
  executiveSummary: string;
  /** Board / steering decisions or diligence confirmations — must not invent approvals that appear in excerpt. */
  executiveKeyDecisionsNeeded: string[];

  cultureRetentionRiskScore: number;
  cultureRetentionNarrative: string;
  culturalIntegrationRoadmap: string[];

  synergiesValueLeakage: string;
  synergyCaptureSteps: string[];
  valueLeakagePrevention: string[];

  integrationTimeline18Month: IntegrationTimelinePhase[];
  crossFunctionalWorkstreams: CrossFunctionalWorkstream[];

  successRateGauges: SuccessGauge[];
  failurePointDetails: FailurePointDetail[];

  trainingAudiencePlans: TrainingAudiencePlan[];
  onboardingSystemsChecklist: string[];
  communicationsCadence: string[];

  /** Model self-check: uncertainties and what evidence would upgrade confidence (no hallucinated KPIs). */
  evidenceGapsAndDiligenceQuestions: string[];

  /** Hedge-aware narrative: how steering should proceed, what to prioritize, and what stays in diligence. */
  recommendedMergerProceeding: string;
  /** Factors that materially improve odds of PMI success — each line must cite source, pattern, or explicit uncertainty. */
  mergerSuccessFactors: string[];
  /** Enterprise-wide ordered steps (distinct from phased timeline granularity). */
  programLevelStepByStep: string[];
  /** Concrete tasking by department / functional area. */
  departmentMergerPlans: DepartmentMergerPlan[];
}
