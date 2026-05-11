"use client";

import { labelsForBankingBusinessTypeIds } from "@/lib/banking-business-types";
import { labelsForHealthcareBusinessTypeIds } from "@/lib/healthcare-business-types";
import { labelsForTechBusinessTypeIds } from "@/lib/technology-business-types";
import { coerceParsedAnalysis } from "@/lib/extract-json";
import type { ParsedAnalysis } from "@/lib/types/analysis";
import type { Deal } from "@/lib/types/deal";
import { nanoid } from "nanoid";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "converis-ai-deals-v1";
const SETTINGS_KEY = "converis-ai-settings-v1";

export type AppSettings = {
  ollamaHost: string;
  ollamaModel: string;
};

const defaultSettings: AppSettings = {
  ollamaHost: "http://127.0.0.1:11434",
  ollamaModel: "qwen2.5:32b",
};

type DealsContextValue = {
  deals: Deal[];
  settings: AppSettings;
  setSettings: (s: Partial<AppSettings>) => void;
  selectedIndustry: string;
  setSelectedIndustry: (industry: string) => void;
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;
  addDeal: (deal: Omit<Deal, "id" | "createdAt" | "updatedAt"> & { id?: string }) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  /** Permanently removes a deal from local session storage (browser). */
  deleteDeal: (id: string) => void;
  appendChat: (dealId: string, role: "user" | "assistant", content: string) => void;
};

const DealsContext = createContext<DealsContextValue | null>(null);

function loadDeals(): Deal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Deal[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((d) => {
      const industry = typeof d.industry === "string" && d.industry.trim() ? d.industry : "Technology";
      const buyerIndustry =
        typeof (d as Partial<Deal>).buyerIndustry === "string" && (d as Partial<Deal>).buyerIndustry?.trim()
          ? String((d as Partial<Deal>).buyerIndustry)
          : industry;
      const sellerIndustry =
        typeof (d as Partial<Deal>).sellerIndustry === "string" && (d as Partial<Deal>).sellerIndustry?.trim()
          ? String((d as Partial<Deal>).sellerIndustry)
          : industry;
      let analysis = d.analysis;
      if (analysis?.parsed) {
        const coerced = coerceParsedAnalysis(analysis.parsed as unknown);
        if (coerced) analysis = { ...analysis, parsed: coerced };
      }
      return { ...d, industry, buyerIndustry, sellerIndustry, analysis };
    });
  } catch {
    return [];
  }
}

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    let model =
      typeof parsed.ollamaModel === "string" ? parsed.ollamaModel : defaultSettings.ollamaModel;
    if (model === "llama3.2") {
      model = defaultSettings.ollamaModel;
    }
    return {
      ollamaHost: typeof parsed.ollamaHost === "string" ? parsed.ollamaHost : defaultSettings.ollamaHost,
      ollamaModel: model,
    };
  } catch {
    return defaultSettings;
  }
}

export function DealsProvider({ children }: { children: React.ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("Technology");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDeals(loadDeals());
    setSettingsState(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  }, [deals, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  const setSettings = useCallback((s: Partial<AppSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...s }));
  }, []);

  const addDeal = useCallback((deal: Omit<Deal, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const now = new Date().toISOString();
    const { id: explicitId, ...dealFields } = deal;
    const id =
      typeof explicitId === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(explicitId) ? explicitId : nanoid();
    const full: Deal = {
      ...dealFields,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setDeals((d) => [full, ...d]);
    setSelectedDealId(full.id);
    return full;
  }, []);

  const updateDeal = useCallback((id: string, patch: Partial<Deal>) => {
    setDeals((list) =>
      list.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
      )
    );
  }, []);

  const deleteDeal = useCallback((id: string) => {
    setDeals((list) => list.filter((d) => d.id !== id));
    setSelectedDealId((cur) => (cur === id ? null : cur));
  }, []);

  const appendChat = useCallback((dealId: string, role: "user" | "assistant", content: string) => {
    setDeals((list) =>
      list.map((d) =>
        d.id === dealId
          ? {
              ...d,
              chatMessages: [...d.chatMessages, { role, content }],
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      deals,
      settings,
      setSettings,
      selectedIndustry,
      setSelectedIndustry,
      selectedDealId,
      setSelectedDealId,
      addDeal,
      updateDeal,
      deleteDeal,
      appendChat,
    }),
    [
      deals,
      settings,
      setSettings,
      selectedIndustry,
      selectedDealId,
      addDeal,
      updateDeal,
      deleteDeal,
      appendChat,
    ]
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

export function useDeals() {
  const ctx = useContext(DealsContext);
  if (!ctx) throw new Error("useDeals must be used within DealsProvider");
  return ctx;
}

export function buildDealContextBlock(deal: Deal, analysis: ParsedAnalysis | null): string {
  const lines: string[] = [
    `Deal: ${deal.name}`,
    `Industry: ${deal.industry}`,
  ];
  if (deal.technologyBusinessTypeIds?.length) {
    lines.push(`Technology business types (labels): ${labelsForTechBusinessTypeIds(deal.technologyBusinessTypeIds)}`);
  }
  if (deal.bankingBusinessTypeIds?.length) {
    lines.push(`Banking business types (labels): ${labelsForBankingBusinessTypeIds(deal.bankingBusinessTypeIds)}`);
  }
  if (deal.healthcareBusinessTypeIds?.length) {
    lines.push(
      `Healthcare business types (labels): ${labelsForHealthcareBusinessTypeIds(deal.healthcareBusinessTypeIds)}`
    );
  }
  if (analysis) {
    const summarize = (text: string, max = 1200) =>
      text.length <= max ? text : `${text.slice(0, max)}…`;
    /** Saved deals may omit newer fields; coercion fills defaults when possible. */
    const normalized = coerceParsedAnalysis(analysis as unknown);
    const a = normalized ?? analysis;
    lines.push(`Executive summary: ${summarize(a.executiveSummary ?? "", 1600)}`);
    lines.push(`Culture/retention risk score: ${a.cultureRetentionRiskScore}`);
    lines.push(`Culture note: ${summarize(a.cultureRetentionNarrative ?? "")}`);
    lines.push(`Synergies & leakage: ${summarize(a.synergiesValueLeakage ?? "", 1400)}`);
    lines.push(`Recommended merger proceeding (excerpt): ${summarize(a.recommendedMergerProceeding ?? "", 1400)}`);
    const programSteps = (a.programLevelStepByStep ?? []).slice(0, 14);
    if (programSteps.length) {
      lines.push(`Program-level merger steps:\n- ${programSteps.join("\n- ")}`);
    }
    const deptLabels = (a.departmentMergerPlans ?? [])
      .slice(0, 10)
      .map((d) => d.department)
      .filter((x): x is string => typeof x === "string" && x.length > 0);
    if (deptLabels.length) {
      lines.push(`Department / function plans touched: ${deptLabels.join(", ")}`);
    }
    const decisions = (a.executiveKeyDecisionsNeeded ?? []).slice(0, 10);
    if (decisions.length) {
      lines.push(`Steering decisions needed:\n- ${decisions.join("\n- ")}`);
    }
    const gaps = (a.evidenceGapsAndDiligenceQuestions ?? []).slice(0, 8);
    if (gaps.length) {
      lines.push(`Evidence gaps / diligence:\n- ${gaps.join("\n- ")}`);
    }
    const failures = (a.failurePointDetails ?? [])
      .slice(0, 8)
      .map((f) => f.title)
      .filter((t) => typeof t === "string" && t.length > 0);
    if (failures.length) {
      lines.push(`Failure modes flagged:\n- ${failures.join("\n- ")}`);
    }
  }
  return lines.join("\n");
}
