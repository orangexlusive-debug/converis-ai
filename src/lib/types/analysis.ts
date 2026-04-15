export interface IntegrationTimelinePhase {
  phase: string;
  monthRange: string;
  milestones: string[];
}

export interface SuccessGauge {
  label: string;
  value: number;
}

export interface ParsedAnalysis {
  executiveSummary: string;
  cultureRetentionRiskScore: number;
  synergiesValueLeakage: string;
  integrationTimeline18Month: IntegrationTimelinePhase[];
  successRateGauges: SuccessGauge[];
  failurePoints: string[];
  trainingOnboardingSuggestions: string[];
}
