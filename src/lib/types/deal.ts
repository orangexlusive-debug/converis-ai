import type { ParsedAnalysis } from "./analysis";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Deal = {
  id: string;
  name: string;
  industry: string;
  /** When industry is Technology, stable ids from `technology-business-types`. */
  technologyBusinessTypeIds?: string[];
  /** When industry is Banking, stable ids from `banking-business-types`. */
  bankingBusinessTypeIds?: string[];
  /** When industry is Healthcare, stable ids from `healthcare-business-types`. */
  healthcareBusinessTypeIds?: string[];
  createdAt: string;
  updatedAt: string;
  buyerFileNames: string[];
  sellerFileNames: string[];
  analysis?: {
    rawResponse: string;
    parsed: ParsedAnalysis | null;
    parseError?: string;
    model: string;
    analyzedAt: string;
  };
  chatMessages: ChatMessage[];
};
