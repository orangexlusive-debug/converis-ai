export const INDUSTRIES = [
  "Technology",
  "Banking",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Energy & Utilities",
  "Telecommunications",
  "Media & Entertainment",
  "Insurance",
  "Pharmaceuticals",
  "Consumer Goods",
  "Professional Services",
  "Construction",
  "Aerospace & Defense",
  "Logistics",
  "Real Estate",
  "Education",
  "Corporate Services",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
