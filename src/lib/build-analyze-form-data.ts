import { BANKING_INDUSTRY } from "@/lib/banking-business-types";
import { HEALTHCARE_INDUSTRY } from "@/lib/healthcare-business-types";
import { TECHNOLOGY_INDUSTRY } from "@/lib/technology-business-types";

/** Canonical `/api/analyze` multipart fields shared by Create Deal and append flows. */
export function populateAnalyzeFormData(
  form: FormData,
  params: {
    dealId: string;
    dealName: string;
    industry: string;
    buyerIndustry: string;
    sellerIndustry: string;
    technologyBusinessTypeIds?: string[];
    bankingBusinessTypeIds?: string[];
    healthcareBusinessTypeIds?: string[];
    ollamaHost: string;
    ollamaModel: string;
    priorBuyerDocumentText?: string | null | undefined;
    priorSellerDocumentText?: string | null | undefined;
    buyerFiles: File[];
    sellerFiles: File[];
  }
): void {
  const {
    dealId,
    dealName,
    industry,
    buyerIndustry,
    sellerIndustry,
    technologyBusinessTypeIds,
    bankingBusinessTypeIds,
    healthcareBusinessTypeIds,
    ollamaHost,
    ollamaModel,
    priorBuyerDocumentText,
    priorSellerDocumentText,
    buyerFiles,
    sellerFiles,
  } = params;

  form.append("dealId", dealId);
  form.append("dealName", dealName.trim());
  form.append("industry", industry);
  form.append("buyerIndustry", buyerIndustry);
  form.append("sellerIndustry", sellerIndustry);
  form.append("ollamaHost", ollamaHost);
  form.append("ollamaModel", ollamaModel);

  if (industry === TECHNOLOGY_INDUSTRY && technologyBusinessTypeIds?.length) {
    form.append("techBusinessTypeIds", JSON.stringify(technologyBusinessTypeIds));
  }
  if (industry === BANKING_INDUSTRY && bankingBusinessTypeIds?.length) {
    form.append("bankingBusinessTypeIds", JSON.stringify(bankingBusinessTypeIds));
  }
  if (industry === HEALTHCARE_INDUSTRY && healthcareBusinessTypeIds?.length) {
    form.append("healthcareBusinessTypeIds", JSON.stringify(healthcareBusinessTypeIds));
  }

  if (priorBuyerDocumentText?.trim()) {
    form.append("priorBuyerDocumentText", priorBuyerDocumentText);
  }
  if (priorSellerDocumentText?.trim()) {
    form.append("priorSellerDocumentText", priorSellerDocumentText);
  }

  buyerFiles.forEach((f) => form.append("buyerFiles", f));
  sellerFiles.forEach((f) => form.append("sellerFiles", f));
}
