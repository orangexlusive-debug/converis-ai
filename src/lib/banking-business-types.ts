/** Industry value from `INDUSTRIES` that unlocks banking business-type selection. */
export const BANKING_INDUSTRY = "Banking" as const;

export type BankingBusinessTypeDef = {
  id: string;
  label: string;
  modelDescription: string;
};

export type BankingBusinessTypeGroup = {
  groupLabel: string;
  types: BankingBusinessTypeDef[];
};

export const BANKING_BUSINESS_TYPE_GROUPS: BankingBusinessTypeGroup[] = [
  {
    groupLabel: "Core banking business types (by primary function)",
    types: [
      {
        id: "retail-banking",
        label: "Retail Banking",
        modelDescription:
          "Serves individual consumers with everyday services like checking/savings accounts, personal loans, mortgages, credit cards, and auto loans.",
      },
      {
        id: "commercial-banking",
        label: "Commercial Banking",
        modelDescription:
          "Focuses on small-to-medium businesses with business checking accounts, loans, lines of credit, cash management, and merchant services.",
      },
      {
        id: "corporate-wholesale-banking",
        label: "Corporate Banking (Wholesale Banking)",
        modelDescription:
          "Provides services to large corporations and institutions, including large-scale lending, trade finance, treasury management, and capital raising.",
      },
      {
        id: "investment-banking",
        label: "Investment Banking",
        modelDescription:
          "Specializes in capital markets activities such as underwriting IPOs, mergers & acquisitions (M&A), advisory services, trading, and asset management for corporations and governments.",
      },
      {
        id: "private-wealth-banking",
        label: "Private Banking / Wealth Management",
        modelDescription:
          "High-net-worth individuals and families get personalized services like investment advice, estate planning, trust services, and concierge banking.",
      },
    ],
  },
  {
    groupLabel: "Digital & modern banking models",
    types: [
      {
        id: "neobanks-digital",
        label: "Digital / Online Banks (Neobanks)",
        modelDescription:
          "Fully app-based or internet-only banks with no physical branches (e.g., mobile-first checking, savings, and lending).",
      },
      {
        id: "challenger-banks",
        label: "Challenger Banks",
        modelDescription:
          "Tech-driven banks that compete with traditional ones by offering simpler, lower-fee services, often with embedded fintech features.",
      },
      {
        id: "mobile-first-banks",
        label: "Mobile-First / App-Based Banks",
        modelDescription:
          "Banks designed primarily for smartphones, emphasizing speed, personalization, and AI-driven tools.",
      },
    ],
  },
  {
    groupLabel: "Specialized or niche banking types",
    types: [
      {
        id: "credit-unions",
        label: "Credit Unions",
        modelDescription:
          "Member-owned, not-for-profit cooperatives that offer banking services (similar to retail banks) but with a focus on community or employee groups.",
      },
      {
        id: "mortgage-lenders",
        label: "Mortgage Banks / Lenders",
        modelDescription:
          "Specialize in home loans, refinancing, and mortgage-backed securities (often without full retail banking services).",
      },
      {
        id: "savings-loan-thrifts",
        label: "Savings & Loan Associations (Thrifts)",
        modelDescription:
          "Focus primarily on savings accounts and mortgage lending (less common today but still exist in some regions).",
      },
      {
        id: "islamic-banking",
        label: "Islamic Banking",
        modelDescription:
          "Operates under Sharia law principles—no interest (riba), profit-sharing models, and ethical investing.",
      },
      {
        id: "central-banking",
        label: "Central Banking",
        modelDescription:
          "Government-owned institutions (e.g., Federal Reserve) that manage monetary policy—not typically considered commercial businesses but a distinct type in the ecosystem.",
      },
    ],
  },
  {
    groupLabel: "Emerging & hybrid banking businesses",
    types: [
      {
        id: "fintech-baas-enabled",
        label: "FinTech-Enabled Banks (BaaS)",
        modelDescription:
          "Traditional or new banks that power white-label banking services for non-bank companies (e.g., embedded finance in apps).",
      },
      {
        id: "crypto-digital-asset-banks",
        label: "Crypto / Digital Asset Banks",
        modelDescription:
          "Banks offering custody, trading, and lending for cryptocurrencies, stablecoins, or blockchain assets.",
      },
      {
        id: "shadow-banking-nbfi",
        label: "Shadow Banking / NBFI",
        modelDescription:
          "Provide lending and credit services outside traditional regulation (e.g., peer-to-peer lending platforms, payday lenders, or specialty finance companies).",
      },
      {
        id: "microfinance",
        label: "Microfinance Institutions",
        modelDescription:
          "Small-scale lending to underserved populations or small businesses in developing markets.",
      },
      {
        id: "trade-finance-export",
        label: "Trade Finance & Export Banks",
        modelDescription:
          "Specialized in international trade, letters of credit, and supply-chain financing.",
      },
    ],
  },
];

const byId = new Map<string, BankingBusinessTypeDef>();
for (const g of BANKING_BUSINESS_TYPE_GROUPS) {
  for (const t of g.types) {
    byId.set(t.id, t);
  }
}

export function getBankingBusinessTypeById(id: string): BankingBusinessTypeDef | undefined {
  return byId.get(id);
}

export function isValidBankingBusinessTypeId(id: string): boolean {
  return byId.has(id);
}

export function labelsForBankingBusinessTypeIds(ids: string[]): string {
  return ids.map((id) => getBankingBusinessTypeById(id)?.label ?? id).join(" · ");
}

export function buildBankingBusinessContextForModel(ids: string[]): string {
  const unique = [...new Set(ids)].filter(isValidBankingBusinessTypeId);
  if (unique.length === 0) return "";

  const lines = unique.map((id) => {
    const t = byId.get(id)!;
    return `- **${t.label}**: ${t.modelDescription}`;
  });

  return [
    "The user scoped this Banking deal to the following business type(s).",
    "Use these definitions for sector-specific PMI reasoning; they may go beyond what appears in the uploaded documents.",
    "",
    ...lines,
  ].join("\n");
}
