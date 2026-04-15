import type { ParsedAnalysis } from "./types/analysis";

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

export function isParsedAnalysis(v: unknown): v is ParsedAnalysis {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.executiveSummary === "string" &&
    typeof o.cultureRetentionRiskScore === "number" &&
    typeof o.synergiesValueLeakage === "string" &&
    Array.isArray(o.integrationTimeline18Month) &&
    Array.isArray(o.successRateGauges) &&
    Array.isArray(o.failurePoints) &&
    Array.isArray(o.trainingOnboardingSuggestions)
  );
}
