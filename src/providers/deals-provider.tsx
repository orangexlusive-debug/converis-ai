"use client";

import { labelsForBankingBusinessTypeIds } from "@/lib/banking-business-types";
import { labelsForHealthcareBusinessTypeIds } from "@/lib/healthcare-business-types";
import { labelsForTechBusinessTypeIds } from "@/lib/technology-business-types";
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
  ollamaHost: "https://4213-98-97-167-90.ngrok-free.app",
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
  addDeal: (deal: Omit<Deal, "id" | "createdAt" | "updatedAt">) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  appendChat: (dealId: string, role: "user" | "assistant", content: string) => void;
};

const DealsContext = createContext<DealsContextValue | null>(null);

function loadDeals(): Deal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Deal[];
    return Array.isArray(parsed) ? parsed : [];
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

  const addDeal = useCallback((deal: Omit<Deal, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const full: Deal = {
      ...deal,
      id: nanoid(),
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
    lines.push(`Executive summary: ${analysis.executiveSummary}`);
    lines.push(`Culture/retention risk score: ${analysis.cultureRetentionRiskScore}`);
    lines.push(`Synergies & leakage: ${analysis.synergiesValueLeakage}`);
  }
  return lines.join("\n");
}
