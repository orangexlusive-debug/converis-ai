import { CONVERIS_ANALYSIS_ROLE_LEAD } from "@/lib/converis-persona";

export function buildAnalysisPrompt(params: {
  dealName: string;
  industry: string;
  buyerText: string;
  sellerText: string;
  buyerTruncated: boolean;
  sellerTruncated: boolean;
  /** Full definitions for Ollama only — not shown to the end user in the UI. */
  technologyBusinessContextForModel?: string;
  bankingBusinessContextForModel?: string;
  healthcareBusinessContextForModel?: string;
}): string {
  const {
    dealName,
    industry,
    buyerText,
    sellerText,
    buyerTruncated,
    sellerTruncated,
    technologyBusinessContextForModel,
    bankingBusinessContextForModel,
    healthcareBusinessContextForModel,
  } = params;

  const techBlock =
    technologyBusinessContextForModel?.trim() ?
      `\n--- TECHNOLOGY BUSINESS TYPE CONTEXT (for the model; user selected types without descriptions in UI) ---\n${technologyBusinessContextForModel.trim()}\n`
      : "";

  const bankingBlock =
    bankingBusinessContextForModel?.trim() ?
      `\n--- BANKING BUSINESS TYPE CONTEXT (for the model; user selected types without descriptions in UI) ---\n${bankingBusinessContextForModel.trim()}\n`
      : "";

  const healthcareBlock =
    healthcareBusinessContextForModel?.trim() ?
      `\n--- HEALTHCARE BUSINESS TYPE CONTEXT (for the model; user selected types without descriptions in UI) ---\n${healthcareBusinessContextForModel.trim()}\n`
      : "";

  return `${CONVERIS_ANALYSIS_ROLE_LEAD}You must respond with a single valid JSON object only — no markdown, no code fences, no commentary before or after the JSON.

Deal name: ${dealName}
Industry context: ${industry}
${techBlock}${bankingBlock}${healthcareBlock}
Document notes:
- Buyer PDF text may be truncated: ${buyerTruncated ? "yes (only first portion used)" : "no"}.
- Seller PDF text may be truncated: ${sellerTruncated ? "yes (only first portion used)" : "no"}.

Use ONLY information inferable from the excerpts below for deal-specific facts (names, figures, commitments). You may apply general M&A, PMI, and cross-industry expertise to structure the analysis, choose appropriate risk themes, and phrase uncertainty—without inventing particulars not supported by the excerpts. Where the text is silent, say so in the relevant string fields.

--- BUYER DOCUMENTS (extracted text) ---
${buyerText || "(empty)"}

--- SELLER DOCUMENTS (extracted text) ---
${sellerText || "(empty)"}

--- REQUIRED JSON SHAPE (all keys required) ---
{
  "executiveSummary": string,
  "cultureRetentionRiskScore": number,
  "synergiesValueLeakage": string,
  "integrationTimeline18Month": [
    { "phase": string, "monthRange": string, "milestones": string[] }
  ],
  "successRateGauges": [ { "label": string, "value": number } ],
  "failurePoints": string[],
  "trainingOnboardingSuggestions": string[]
}

Rules:
- "cultureRetentionRiskScore" is 0–100 where higher means greater retention/culture risk.
- "successRateGauges": each "value" is 0–100.
- Provide 3–6 phases in "integrationTimeline18Month" spanning ~18 months (labels must reflect the excerpt or clearly state uncertainty).
- "failurePoints" and "trainingOnboardingSuggestions" are string arrays grounded in the excerpts or explicit uncertainty.`;
}
