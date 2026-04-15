export const HEALTHCARE_INDUSTRY = "Healthcare" as const;

export type HealthcareBusinessTypeDef = {
  id: string;
  label: string;
  modelDescription: string;
};

export type HealthcareBusinessTypeGroup = {
  groupLabel: string;
  types: HealthcareBusinessTypeDef[];
};

export const HEALTHCARE_BUSINESS_TYPE_GROUPS: HealthcareBusinessTypeGroup[] = [
  {
    groupLabel: "Core healthcare business types (by primary service or facility)",
    types: [
      {
        id: "hospitals-health-systems",
        label: "Hospitals & Health Systems",
        modelDescription:
          "Acute-care facilities providing inpatient treatment, emergency services, surgery, and specialized departments (e.g., general hospitals, academic medical centers, or integrated health networks).",
      },
      {
        id: "outpatient-ambulatory",
        label: "Outpatient Clinics & Ambulatory Care Centers",
        modelDescription:
          "Walk-in or scheduled care for diagnostics, minor procedures, physical therapy, or specialty visits (e.g., urgent care, surgery centers, dialysis clinics).",
      },
      {
        id: "physician-practices-groups",
        label: "Physician Practices & Medical Groups",
        modelDescription:
          "Independent or group practices of doctors offering primary care, specialty care (cardiology, oncology, etc.), or multi-specialty services.",
      },
      {
        id: "pharmacies-retail-health",
        label: "Pharmacies & Retail Health",
        modelDescription:
          "Community pharmacies, hospital pharmacies, mail-order, or retail clinics inside stores (e.g., CVS MinuteClinic) that dispense medications and basic care.",
      },
      {
        id: "dental-oral-health",
        label: "Dental Practices & Oral Health",
        modelDescription:
          "General dentistry, orthodontics, oral surgery, or dental service organizations (DSOs) that manage multiple locations.",
      },
    ],
  },
  {
    groupLabel: "Payers & insurance-focused businesses",
    types: [
      {
        id: "health-insurance-payers",
        label: "Health Insurance Companies / Payers",
        modelDescription:
          "Providers of health plans, including private insurers, HMOs (Health Maintenance Organizations), PPOs (Preferred Provider Organizations), and government programs like Medicare Advantage plans.",
      },
      {
        id: "managed-care-organizations",
        label: "Managed Care Organizations",
        modelDescription:
          "Entities that coordinate care and control costs through networks of providers (e.g., ACOs — Accountable Care Organizations).",
      },
      {
        id: "third-party-administrators",
        label: "Third-Party Administrators (TPAs)",
        modelDescription:
          "Companies that handle claims processing, benefits administration, and network management for self-insured employers.",
      },
    ],
  },
  {
    groupLabel: "Life sciences & product-based businesses",
    types: [
      {
        id: "pharmaceutical-companies",
        label: "Pharmaceutical Companies",
        modelDescription:
          "Develop, manufacture, and market prescription drugs, generics, or over-the-counter medications.",
      },
      {
        id: "biotech-firms",
        label: "Biotechnology (Biotech) Firms",
        modelDescription:
          "Focus on research-driven therapies using living organisms (e.g., gene therapy, monoclonal antibodies, vaccines).",
      },
      {
        id: "medical-device-manufacturers",
        label: "Medical Device & Equipment Manufacturers",
        modelDescription:
          "Design and produce devices like pacemakers, imaging machines (MRI/CT), surgical tools, prosthetics, or diagnostic equipment.",
      },
      {
        id: "diagnostic-laboratory-services",
        label: "Diagnostic & Laboratory Services",
        modelDescription:
          "Independent labs, pathology services, genetic testing companies, or imaging centers (radiology, MRI, ultrasound).",
      },
    ],
  },
  {
    groupLabel: "Specialized & niche healthcare businesses",
    types: [
      {
        id: "long-term-care-senior",
        label: "Long-Term Care & Senior Services",
        modelDescription:
          "Nursing homes, assisted living facilities, hospice care, or home health agencies providing ongoing support for elderly or chronically ill patients.",
      },
      {
        id: "behavioral-mental-health",
        label: "Behavioral & Mental Health",
        modelDescription:
          "Inpatient/outpatient psychiatric hospitals, counseling centers, substance abuse treatment facilities, or tele-mental health providers.",
      },
      {
        id: "rehabilitation-therapy",
        label: "Rehabilitation & Therapy Centers",
        modelDescription:
          "Physical, occupational, or speech therapy providers, often focused on post-surgery or injury recovery.",
      },
      {
        id: "veterinary-animal-health",
        label: "Veterinary Health (Animal Health Businesses)",
        modelDescription:
          "Clinics, hospitals, or pharma/device companies serving pets and livestock (sometimes grouped under broader healthcare).",
      },
    ],
  },
  {
    groupLabel: "Digital & emerging healthcare business types",
    types: [
      {
        id: "telehealth-virtual-care",
        label: "Telehealth & Virtual Care Providers",
        modelDescription:
          "App- or platform-based services for remote consultations, monitoring, or chronic disease management.",
      },
      {
        id: "healthtech-digital-health",
        label: "HealthTech / Digital Health Companies",
        modelDescription:
          "Software platforms for electronic health records (EHR), patient portals, AI diagnostics, wearable health devices, or population health analytics.",
      },
      {
        id: "wellness-preventive",
        label: "Wellness & Preventive Care Businesses",
        modelDescription:
          "Corporate wellness programs, fitness apps with medical integration, nutraceutical/supplement companies, or concierge medicine practices.",
      },
      {
        id: "medicare-medicaid-providers",
        label: "Medicare/Medicaid Service Providers",
        modelDescription:
          "Specialized firms focused exclusively on government-sponsored programs, often including value-based care models.",
      },
    ],
  },
  {
    groupLabel: "Hybrid & cross-industry models",
    types: [
      {
        id: "pharmacy-benefit-managers",
        label: "Pharmacy Benefit Managers (PBMs)",
        modelDescription:
          "Companies that negotiate drug prices and manage prescription benefits for insurers and employers.",
      },
      {
        id: "contract-research-organizations",
        label: "Contract Research Organizations (CROs)",
        modelDescription:
          "Outsourced services for clinical trials, drug development, and regulatory support (often partnered with pharma/biotech).",
      },
      {
        id: "healthcare-staffing-recruitment",
        label: "Healthcare Staffing & Recruitment Agencies",
        modelDescription:
          "Temporary or permanent placement of nurses, doctors, and allied health professionals.",
      },
      {
        id: "medical-tourism-international",
        label: "Medical Tourism & International Providers",
        modelDescription:
          "Facilities or agencies arranging care abroad for cost or specialty reasons.",
      },
    ],
  },
];

const byId = new Map<string, HealthcareBusinessTypeDef>();
for (const g of HEALTHCARE_BUSINESS_TYPE_GROUPS) {
  for (const t of g.types) {
    byId.set(t.id, t);
  }
}

export function getHealthcareBusinessTypeById(id: string): HealthcareBusinessTypeDef | undefined {
  return byId.get(id);
}

export function isValidHealthcareBusinessTypeId(id: string): boolean {
  return byId.has(id);
}

export function labelsForHealthcareBusinessTypeIds(ids: string[]): string {
  return ids.map((id) => getHealthcareBusinessTypeById(id)?.label ?? id).join(" · ");
}

export function buildHealthcareBusinessContextForModel(ids: string[]): string {
  const unique = [...new Set(ids)].filter(isValidHealthcareBusinessTypeId);
  if (unique.length === 0) return "";

  const lines = unique.map((id) => {
    const t = byId.get(id)!;
    return `- **${t.label}**: ${t.modelDescription}`;
  });

  return [
    "The user scoped this Healthcare deal to the following business type(s).",
    "Use these definitions for sector-specific PMI reasoning; they may go beyond what appears in the uploaded documents.",
    "",
    ...lines,
  ].join("\n");
}
