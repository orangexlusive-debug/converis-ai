import { CONVERIS_ANALYSIS_ROLE_LEAD } from "@/lib/converis-persona";

export function buildAnalysisPrompt(params: {
  dealName: string;
  industry: string;
  buyerIndustry?: string;
  sellerIndustry?: string;
  buyerText: string;
  sellerText: string;
  buyerTruncated: boolean;
  sellerTruncated: boolean;
  /** Full definitions for the model prompt only — not shown to the end user in the UI. */
  technologyBusinessContextForModel?: string;
  bankingBusinessContextForModel?: string;
  healthcareBusinessContextForModel?: string;
  /** Retrieved knowledge base excerpts formatted for the prompt. */
  kbContext?: string;
}): string {
  const {
    dealName,
    industry,
    buyerIndustry,
    sellerIndustry,
    buyerText,
    sellerText,
    buyerTruncated,
    sellerTruncated,
    technologyBusinessContextForModel,
    bankingBusinessContextForModel,
    healthcareBusinessContextForModel,
    kbContext,
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
Buyer industry: ${buyerIndustry || industry}
Seller industry: ${sellerIndustry || industry}
Industry context: ${industry}
${techBlock}${bankingBlock}${healthcareBlock}
${kbContext ?? ""}
Document notes:
- Buyer PDF text may be truncated: ${buyerTruncated ? "yes (only first portion used)" : "no"}.
- Seller PDF text may be truncated: ${sellerTruncated ? "yes (only first portion used)" : "no"}.

GROUNDING + ANTI-FABRICATION (STRICT):
- You MAY use expert PMI framing (phases, IMO, governance patterns, diligence questions) as **conditional guidance** when you label it clearly as general practice, hedged with **if / recommend / typical pattern / requires validation in diligence**, and tie it to analogous signals you **can** point to in the excerpts or KB.
- For \`recommendedMergerProceeding\`, \`mergerSuccessFactors\`, \`programLevelStepByStep\`, \`departmentMergerPlans\`, and **cross-cutting recommendations**: every materially specific claim about **this** deal must trace to BUYER/SELLER documents, KB (\`[KB #]\`), or an explicitly labeled **PUBLIC** fact pack if one was provided earlier in the prompt. Otherwise prefix with **"Recommend (industry pattern):"**, **"If your operating model includes …"**, or **"Confirm in diligence:"** — never state invented org facts, budgets, headcount, tool names, or deadlines as if known.
- **Department names** in \`departmentMergerPlans\` must mirror **named functions/units** only when evidenced; otherwise use neutral PMI labels (e.g. "Finance / accounting (as applicable)") and say scope depends on org design in diligence.
- You MUST NOT invent **deal-specific facts**: named people, financial line items, KPIs, percentages, headcount, precise dates, contractual clauses, system names, ticket volumes, survey scores, retention rates, synergy $, run-rate claims, or undisclosed policies — unless they explicitly appear in BUYER/SELLER text or KB excerpts.
- For **numeric gauges and scores** (\`cultureRetentionRiskScore\`, \`successRateGauges[].value\`): they are **qualitative indices only**. Calibrate them using tensions and signals you can trace to text (e.g., conflicting operating models, turnover language, integration complexity hints). If excerpts are thin, use **mid-range values (45–55)** and say in the adjacent narrative that evidence is insufficient for a precise calibration. **Never** pretend a number came from a quantitative study that was not sourced.
- Prefer **traceable language** in narratives: quote short phrases or reference section themes from documents when making a deal-specific assertion; otherwise default to hedged recommendations + diligence questions.
- When you use knowledge base content, cite inline with [KB #]. Do not cite KB for general expertise that is not actually drawn from those excerpts.
- Use \`evidenceGapsAndDiligenceQuestions\` to list missing artifacts and questions that would materially change the plan — instead of filling gaps with fiction.

--- BUYER DOCUMENTS (extracted text) ---
${buyerText || "(empty)"}

--- SELLER DOCUMENTS (extracted text) ---
${sellerText || "(empty)"}

--- REQUIRED JSON (single object, all keys required, arrays must be non-empty where a minimum is given) ---
{
  "executiveSummary": string,
  "executiveKeyDecisionsNeeded": string[],
  "cultureRetentionRiskScore": number,
  "cultureRetentionNarrative": string,
  "culturalIntegrationRoadmap": string[],
  "synergiesValueLeakage": string,
  "synergyCaptureSteps": string[],
  "valueLeakagePrevention": string[],
  "integrationTimeline18Month": [
    {
      "phase": string,
      "monthRange": string,
      "objectives": string,
      "milestones": string[],
      "actionableSteps": string[],
      "decisionGates": string[]
    }
  ],
  "crossFunctionalWorkstreams": [
    { "name": string, "purpose": string, "keyActivities": string[], "dependencies": string[] }
  ],
  "successRateGauges": [ { "label": string, "value": number } ],
  "failurePointDetails": [
    {
      "title": string,
      "earlyWarningSignals": string[],
      "mitigationSteps": string[]
    }
  ],
  "trainingAudiencePlans": [
    {
      "audience": string,
      "learningObjectives": string[],
      "modalities": string[],
      "curriculumTopics": string[],
      "sequencing": string,
      "competencyChecks": string[]
    }
  ],
  "onboardingSystemsChecklist": string[],
  "communicationsCadence": string[],
  "evidenceGapsAndDiligenceQuestions": string[],
  "recommendedMergerProceeding": string,
  "mergerSuccessFactors": string[],
  "programLevelStepByStep": string[],
  "departmentMergerPlans": [
    {
      "department": string,
      "mandate": string,
      "priorityTasks": string[],
      "coordinatesWith": string[],
      "readinessChecks": string[]
    }
  ]
}

CONTENT RULES (density + structure):
- **executiveSummary**: 4–8 dense paragraphs. Lead with what is **known from sources** versus what is **unknown / needs diligence**. No fake figures.
- **executiveKeyDecisionsNeeded**: ≥6 items. Each is a concrete decision, approval, or policy choice steering must make — phrased without fake outcomes.
- **cultureRetentionNarrative**: deep narrative tying **observable** cultural/retention tensions to mitigations; explicitly call out where documents are silent.
- **culturalIntegrationRoadmap**: ≥10 ordered steps (culture/change/retention mechanics), each step actionable and labeled when it is contingent on diligence.
- **synergiesValueLeakage**: structured prose covering revenue/cost/capital synergies **only as hypotheses** grounded in documents; separate **value leakage** mechanisms and **guards** without inventing synergy $.
- **synergyCaptureSteps** and **valueLeakagePrevention**: each ≥8 bullets; use verb-led steps; mark validation needs where sources are incomplete.
- **integrationTimeline18Month**: **5–8** phases covering ~18 months. Every phase MUST include: **objectives**, **milestones** (≥4), **actionableSteps** (≥8 sequential work instructions), **decisionGates** (≥3). Steps should read like a playbook (who does what, what gets produced), without inventing calendars not in sources (use relative windows like "within first 30–60 days post-close" only as **generic PMI pattern** explicitly hedged if not sourced).
- **crossFunctionalWorkstreams**: **4–8** streams (e.g., IMO, HR/people, finance, technology, customer/revenue, legal/compliance, communications). Each with **purpose**, **keyActivities** (≥5), **dependencies** (≥2) — all hedged when facts are missing.
- **successRateGauges**: **6–10** gauges with **descriptive labels** (e.g., "Data quality readiness for Day-1 reporting") and **values 0–100** per the anti-fabrication rule for indices.
- **failurePointDetails**: **8–14** items. Each title names a failure mode; **earlyWarningSignals** (≥3 observable signals, qualitative); **mitigationSteps** (≥4 concrete mitigation actions). Avoid inventing telemetry or KPIs not in sources.
- **trainingAudiencePlans**: **3–6** audiences (leadership, managers, sellers, engineers, support, unionized groups if relevant from text, etc.). Each needs non-empty arrays for objectives/modalities/curriculum/competencyChecks and a clear **sequencing** string conditioned on disclosures.
- **onboardingSystemsChecklist**: ≥10 items tightly tied to **access, compliance, segregation of duties** without naming systems absent from documents (use placeholders like "systems referenced in diligence pack" when appropriate).
- **communicationsCadence**: ≥8 bullets covering stakeholders (steering, IMO, employees, customers, regulators if relevant) — no fabricated send dates unless sourced.
- **evidenceGapsAndDiligenceQuestions**: ≥8 items naming missing documents/data and the decision each would unblock.
- **recommendedMergerProceeding**: **7–12** dense paragraphs. Read as an **advisory path** for steering/IMO: sequencing of decisions, how to de-risk close-to-value, what to parallelize vs gate, and where to stop and wait for diligence — heavy use of sourcing vs hedged PMI patterns (“Recommend …”, “If applicable …”).
- **mergerSuccessFactors**: ≥**12** bullets. Each must be actionable and either (a) explain what **evidence supports** focusing here, or (b) labeled explicitly as conditional industry practice needing validation — no vanity metrics or fake benchmarks.
- **programLevelStepByStep**: ≥**18** bullets in **execution order** at **program/portfolio level** (distinct from phased timeline bullets — these are coarse “chapter” moves like charter IMO, stabilize revenue, converge policies, converge technology where cited, etc.).
- **departmentMergerPlans**: ≥**10** departments or functional pillars (fewer **only if** explicitly justified because documents portray a materially smaller footprint). Each object needs **mandate** (≤3 sentences), **priorityTasks** (≥**7** verbs-first tasks assigning concrete work outputs), **coordinatesWith** (≥**4** counterpart functions or workstreams referenced from sources **or** “IMO / steer-co / legal / HR … as applicable”), **readinessChecks** (≥**4** qualitative checks — no fabricated KPIs).

Respond with compact JSON — avoid unnecessary filler words outside string values, but string values themselves should be substantive.`;
}
