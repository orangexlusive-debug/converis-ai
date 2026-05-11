import type { ParsedAnalysis } from "./analysis";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Deal = {
  id: string;
  name: string;
  /** Primary industry used for analysis framework + filtering. */
  industry: string;
  /** Industry of the buyer company (may differ from seller). */
  buyerIndustry: string;
  /** Industry of the seller company (may differ from buyer). */
  sellerIndustry: string;
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
  /**
   * Full extracted text from buyer-side uploads (last successful `/api/analyze`), used when
   * appending documents so prior materials stay in scope without re-upload.
   */
  buyerDocumentText?: string;
  /** Same role as `buyerDocumentText` for seller-side uploads. */
  sellerDocumentText?: string;
  analysis?: {
    rawResponse: string;
    parsed: ParsedAnalysis | null;
    parseError?: string;
    model: string;
    analyzedAt: string;
  };
  chatMessages: ChatMessage[];
};
