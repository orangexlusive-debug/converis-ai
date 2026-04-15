/** Industry value from `INDUSTRIES` that unlocks technology business-type selection. */
export const TECHNOLOGY_INDUSTRY = "Technology" as const;

export type TechBusinessTypeDef = {
  id: string;
  /** Shown in the UI only (no long description in the UI). */
  label: string;
  /** Sent to the model only — full definition for reasoning. */
  modelDescription: string;
};

export type TechBusinessTypeGroup = {
  /** Short group heading in the UI (no per-type descriptions). */
  groupLabel: string;
  types: TechBusinessTypeDef[];
};

export const TECH_BUSINESS_TYPE_GROUPS: TechBusinessTypeGroup[] = [
  {
    groupLabel: "Core tech business types (by product or service focus)",
    types: [
      {
        id: "hardware-manufacturers",
        label: "Hardware Manufacturers",
        modelDescription:
          "Design and produce physical tech products like smartphones, computers, servers, consumer electronics, wearables, or semiconductors/chips.",
      },
      {
        id: "software-companies",
        label: "Software Companies",
        modelDescription:
          "Develop applications, platforms, or tools. Includes SaaS (Software as a Service), enterprise software, mobile apps, desktop software, and open-source solutions.",
      },
      {
        id: "it-services-consulting",
        label: "IT Services & Consulting",
        modelDescription:
          "Provide managed services (MSPs), outsourcing, system integration, technical support, break-fix services, or IT consulting for businesses.",
      },
      {
        id: "cloud-infrastructure",
        label: "Cloud & Infrastructure Providers",
        modelDescription:
          "Offer cloud computing (IaaS, PaaS), data centers, storage solutions, networking infrastructure, or edge computing services.",
      },
      {
        id: "cybersecurity",
        label: "Cybersecurity Specialists",
        modelDescription:
          "Build tools and services for threat detection, data protection, network security, identity management, and compliance.",
      },
    ],
  },
  {
    groupLabel: "Vertical / industry-specific tech businesses (X-Tech)",
    types: [
      {
        id: "fintech",
        label: "FinTech",
        modelDescription:
          "Financial technology focused on banking apps, payments, lending platforms, insurance tech, investment tools, or cryptocurrency/blockchain finance.",
      },
      {
        id: "health-med-biotech",
        label: "HealthTech / MedTech / BioTech",
        modelDescription:
          "Healthcare-related tech such as telemedicine, medical devices, electronic health records, diagnostics, wearable health monitors, or biotech tools.",
      },
      {
        id: "edtech",
        label: "EdTech",
        modelDescription:
          "Education technology including online learning platforms, e-learning tools, student management systems, or AI-powered tutoring.",
      },
      {
        id: "clean-green-agritech",
        label: "CleanTech / Green Tech / AgriTech",
        modelDescription:
          "Sustainability-focused tech for renewable energy, climate solutions, smart agriculture, waste management, or environmental monitoring.",
      },
      {
        id: "other-verticals",
        label: "Other Verticals",
        modelDescription:
          "ConTech (construction), PropTech (real estate), LegalTech, RetailTech, or AutoTech (connected/autonomous vehicles).",
      },
    ],
  },
  {
    groupLabel: "Other common or emerging tech business types",
    types: [
      {
        id: "ecommerce-marketplaces",
        label: "E-commerce & Marketplace Platforms",
        modelDescription:
          "Online retail sites, digital marketplaces, or B2B/B2C transaction platforms.",
      },
      {
        id: "gaming-entertainment",
        label: "Gaming & Entertainment Tech",
        modelDescription:
          "Video game studios, esports platforms, streaming services, or AR/VR/Metaverse experiences.",
      },
      {
        id: "ai-ml",
        label: "Artificial Intelligence & Machine Learning",
        modelDescription:
          "Companies building AI models, generative tools, automation software, computer vision, or NLP solutions.",
      },
      {
        id: "data-analytics-big-data",
        label: "Data Analytics & Big Data",
        modelDescription:
          "Tools for data processing, business intelligence, analytics dashboards, or predictive modeling.",
      },
      {
        id: "telecom-networking",
        label: "Telecommunications & Networking",
        modelDescription:
          "Providers of internet services, mobile networks, 5G/6G infrastructure, or communication tools.",
      },
      {
        id: "blockchain-web3-crypto",
        label: "Blockchain, Web3 & Crypto",
        modelDescription:
          "Decentralized apps, NFTs, smart contracts, cryptocurrency exchanges, or blockchain infrastructure.",
      },
      {
        id: "iot",
        label: "Internet of Things (IoT)",
        modelDescription:
          "Connected devices, smart home/industrial sensors, or IoT platforms for automation and data collection.",
      },
      {
        id: "robotics-automation",
        label: "Robotics & Automation",
        modelDescription:
          "Industrial robots, service robots, drone tech, or process automation systems.",
      },
    ],
  },
];

const byId = new Map<string, TechBusinessTypeDef>();
for (const g of TECH_BUSINESS_TYPE_GROUPS) {
  for (const t of g.types) {
    byId.set(t.id, t);
  }
}

export function getTechBusinessTypeById(id: string): TechBusinessTypeDef | undefined {
  return byId.get(id);
}

export function isValidTechBusinessTypeId(id: string): boolean {
  return byId.has(id);
}

/** Text block for the model only (labels + definitions). */
export function labelsForTechBusinessTypeIds(ids: string[]): string {
  return ids.map((id) => getTechBusinessTypeById(id)?.label ?? id).join(" · ");
}

export function buildTechnologyBusinessContextForModel(ids: string[]): string {
  const unique = [...new Set(ids)].filter(isValidTechBusinessTypeId);
  if (unique.length === 0) return "";

  const lines = unique.map((id) => {
    const t = byId.get(id)!;
    return `- **${t.label}**: ${t.modelDescription}`;
  });

  return [
    "The user scoped this Technology deal to the following business type(s).",
    "Use these definitions for sector-specific PMI reasoning; they may go beyond what appears in the uploaded documents.",
    "",
    ...lines,
  ].join("\n");
}
