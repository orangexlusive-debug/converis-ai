import { NextResponse } from "next/server";
import { buildAnalysisPrompt } from "@/lib/analysis-prompt";
import { coerceParsedAnalysis, extractJsonObject } from "@/lib/extract-json";
import { INDUSTRIES } from "@/lib/industries";
import {
  BANKING_INDUSTRY,
  buildBankingBusinessContextForModel,
  isValidBankingBusinessTypeId,
} from "@/lib/banking-business-types";
import {
  HEALTHCARE_INDUSTRY,
  buildHealthcareBusinessContextForModel,
  isValidHealthcareBusinessTypeId,
} from "@/lib/healthcare-business-types";
import {
  TECHNOLOGY_INDUSTRY,
  buildTechnologyBusinessContextForModel,
  isValidTechBusinessTypeId,
} from "@/lib/technology-business-types";
import { normalizeOllamaHost, normalizeOllamaModel } from "@/lib/ollama-config";
import { extractDocumentText } from "@/lib/document-extract";
import {
  ollamaTunnelHeaders,
  parseOllamaGenerateResponse,
  responseLooksLikeHtml,
} from "@/lib/ollama-http";
import { formatKbContext, indexDealUploads, retrieveFromKnowledgeBase } from "@/lib/rag/store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    return await handleAnalyzePost(req);
  } catch (e) {
    console.error("[api/analyze]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Internal error while analyzing. Check server logs.",
      },
      { status: 500 }
    );
  }
}

async function handleAnalyzePost(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read request body (file too large or invalid multipart)." },
      { status: 400 }
    );
  }

  const dealIdRaw = String(form.get("dealId") ?? "").trim();
  const stableDealId = /^[a-zA-Z0-9_-]{8,128}$/.test(dealIdRaw) ? dealIdRaw : "";

  const dealName = String(form.get("dealName") ?? "").trim();
  const industry = String(form.get("industry") ?? "").trim();
  const buyerIndustryRaw = String(form.get("buyerIndustry") ?? "").trim();
  const sellerIndustryRaw = String(form.get("sellerIndustry") ?? "").trim();
  const techBusinessTypeIdsRaw = String(form.get("techBusinessTypeIds") ?? "").trim();
  const bankingBusinessTypeIdsRaw = String(form.get("bankingBusinessTypeIds") ?? "").trim();
  const healthcareBusinessTypeIdsRaw = String(form.get("healthcareBusinessTypeIds") ?? "").trim();
  const ollamaHost = normalizeOllamaHost(String(form.get("ollamaHost") ?? ""));
  const ollamaModel = normalizeOllamaModel(String(form.get("ollamaModel") ?? ""));

  let techBusinessTypeIds: string[] = [];
  if (techBusinessTypeIdsRaw) {
    try {
      const parsed = JSON.parse(techBusinessTypeIdsRaw) as unknown;
      if (Array.isArray(parsed)) {
        techBusinessTypeIds = parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid techBusinessTypeIds (expected JSON array of strings)." },
        { status: 400 }
      );
    }
  }

  let bankingBusinessTypeIds: string[] = [];
  if (bankingBusinessTypeIdsRaw) {
    try {
      const parsed = JSON.parse(bankingBusinessTypeIdsRaw) as unknown;
      if (Array.isArray(parsed)) {
        bankingBusinessTypeIds = parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid bankingBusinessTypeIds (expected JSON array of strings)." },
        { status: 400 }
      );
    }
  }

  let healthcareBusinessTypeIds: string[] = [];
  if (healthcareBusinessTypeIdsRaw) {
    try {
      const parsed = JSON.parse(healthcareBusinessTypeIdsRaw) as unknown;
      if (Array.isArray(parsed)) {
        healthcareBusinessTypeIds = parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid healthcareBusinessTypeIds (expected JSON array of strings)." },
        { status: 400 }
      );
    }
  }

  if (!dealName) {
    return NextResponse.json({ error: "Deal name is required." }, { status: 400 });
  }
  if (!INDUSTRIES.includes(industry as (typeof INDUSTRIES)[number])) {
    return NextResponse.json({ error: "A valid industry selection is required." }, { status: 400 });
  }

  const buyerIndustry =
    buyerIndustryRaw && INDUSTRIES.includes(buyerIndustryRaw as (typeof INDUSTRIES)[number])
      ? buyerIndustryRaw
      : industry;
  const sellerIndustry =
    sellerIndustryRaw && INDUSTRIES.includes(sellerIndustryRaw as (typeof INDUSTRIES)[number])
      ? sellerIndustryRaw
      : industry;

  if (industry === TECHNOLOGY_INDUSTRY) {
    if (techBusinessTypeIds.length === 0) {
      return NextResponse.json(
        { error: "For Technology deals, select at least one business type." },
        { status: 400 }
      );
    }
    const unknown = techBusinessTypeIds.filter((id) => !isValidTechBusinessTypeId(id));
    if (unknown.length > 0) {
      return NextResponse.json(
        { error: `Unknown technology business type id(s): ${unknown.join(", ")}` },
        { status: 400 }
      );
    }
  } else if (techBusinessTypeIds.length > 0) {
    return NextResponse.json(
      { error: "Technology business types may only be sent when industry is Technology." },
      { status: 400 }
    );
  }

  if (industry === BANKING_INDUSTRY) {
    if (bankingBusinessTypeIds.length === 0) {
      return NextResponse.json(
        { error: "For Banking deals, select at least one business type." },
        { status: 400 }
      );
    }
    const unknownB = bankingBusinessTypeIds.filter((id) => !isValidBankingBusinessTypeId(id));
    if (unknownB.length > 0) {
      return NextResponse.json(
        { error: `Unknown banking business type id(s): ${unknownB.join(", ")}` },
        { status: 400 }
      );
    }
  } else if (bankingBusinessTypeIds.length > 0) {
    return NextResponse.json(
      { error: "Banking business types may only be sent when industry is Banking." },
      { status: 400 }
    );
  }

  if (industry === HEALTHCARE_INDUSTRY) {
    if (healthcareBusinessTypeIds.length === 0) {
      return NextResponse.json(
        { error: "For Healthcare deals, select at least one business type." },
        { status: 400 }
      );
    }
    const unknownH = healthcareBusinessTypeIds.filter((id) => !isValidHealthcareBusinessTypeId(id));
    if (unknownH.length > 0) {
      return NextResponse.json(
        { error: `Unknown healthcare business type id(s): ${unknownH.join(", ")}` },
        { status: 400 }
      );
    }
  } else if (healthcareBusinessTypeIds.length > 0) {
    return NextResponse.json(
      { error: "Healthcare business types may only be sent when industry is Healthcare." },
      { status: 400 }
    );
  }

  const buyerFiles = form.getAll("buyerFiles").filter((f): f is File => f instanceof File);
  const sellerFiles = form.getAll("sellerFiles").filter((f): f is File => f instanceof File);

  const priorBuyerDocumentText = String(form.get("priorBuyerDocumentText") ?? "");
  const priorSellerDocumentText = String(form.get("priorSellerDocumentText") ?? "");

  const hasNewUploads = buyerFiles.length > 0 || sellerFiles.length > 0;
  const priorBuyerTrimmed = priorBuyerDocumentText.trim();
  const priorSellerTrimmed = priorSellerDocumentText.trim();
  const hasPriorDocText = priorBuyerTrimmed.length > 0 || priorSellerTrimmed.length > 0;

  if (!hasNewUploads && !hasPriorDocText) {
    return NextResponse.json(
      {
        error:
          "Add at least one buyer or seller document, or supply cached extracted text when re-analyzing without new uploads.",
      },
      { status: 400 }
    );
  }

  const buyerParts: string[] = [];
  const sellerParts: string[] = [];
  let buyerTrunc = false;
  let sellerTrunc = false;

  for (const f of buyerFiles) {
    if (f.size === 0) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const result = await extractDocumentText(f.name, f.type, buf);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    buyerTrunc = buyerTrunc || result.truncated;
    buyerParts.push(`### ${f.name}\n${result.text}`);
  }
  for (const f of sellerFiles) {
    if (f.size === 0) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const result = await extractDocumentText(f.name, f.type, buf);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    sellerTrunc = sellerTrunc || result.truncated;
    sellerParts.push(`### ${f.name}\n${result.text}`);
  }

  if (buyerParts.length === 0 && sellerParts.length === 0 && !hasPriorDocText) {
    return NextResponse.json(
      { error: "No non-empty documents could be read. Check file types and try again." },
      { status: 400 }
    );
  }

  const buyerBundles: string[] = [];
  if (priorBuyerTrimmed) buyerBundles.push(`### Prior buyer-side uploads (cached)\n${priorBuyerTrimmed}`);
  if (buyerParts.length) buyerBundles.push(`### New buyer-side uploads\n${buyerParts.join("\n\n")}`);
  const buyerText = buyerBundles.join("\n\n").trim();

  const sellerBundles: string[] = [];
  if (priorSellerTrimmed) sellerBundles.push(`### Prior seller-side uploads (cached)\n${priorSellerTrimmed}`);
  if (sellerParts.length) sellerBundles.push(`### New seller-side uploads\n${sellerParts.join("\n\n")}`);
  const sellerText = sellerBundles.join("\n\n").trim();

  if (!buyerText && !sellerText) {
    return NextResponse.json(
      { error: "No usable buyer or seller text after merging cached content and new uploads." },
      { status: 400 }
    );
  }

  // RAG: retrieve relevant domain knowledge from local knowledge_base.
  const ragQuery = [
    "M&A",
    "post-merger integration",
    "PMI",
    dealName,
    `buyer industry: ${buyerIndustry}`,
    `seller industry: ${sellerIndustry}`,
    `analysis framework industry: ${industry}`,
  ].join(" · ");
  let kbHits: Awaited<ReturnType<typeof retrieveFromKnowledgeBase>> = [];
  try {
    kbHits = await retrieveFromKnowledgeBase({ query: ragQuery, ollamaHost, topK: undefined });
  } catch (e) {
    // If embeddings/indexing fails, continue without KB (still fully local).
    console.warn("[rag] KB retrieval failed:", e);
    kbHits = [];
  }
  const kbContext = formatKbContext(kbHits);

  const technologyBusinessContextForModel =
    industry === TECHNOLOGY_INDUSTRY && techBusinessTypeIds.length > 0
      ? buildTechnologyBusinessContextForModel(techBusinessTypeIds)
      : undefined;

  const bankingBusinessContextForModel =
    industry === BANKING_INDUSTRY && bankingBusinessTypeIds.length > 0
      ? buildBankingBusinessContextForModel(bankingBusinessTypeIds)
      : undefined;

  const healthcareBusinessContextForModel =
    industry === HEALTHCARE_INDUSTRY && healthcareBusinessTypeIds.length > 0
      ? buildHealthcareBusinessContextForModel(healthcareBusinessTypeIds)
      : undefined;

  const prompt = buildAnalysisPrompt({
    dealName,
    industry,
    buyerIndustry,
    sellerIndustry,
    buyerText,
    sellerText,
    buyerTruncated: buyerTrunc,
    sellerTruncated: sellerTrunc,
    technologyBusinessContextForModel,
    bankingBusinessContextForModel,
    healthcareBusinessContextForModel,
    kbContext,
  });

  const url = `${ollamaHost}/api/generate`;
  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(url, {
      method: "POST",
      headers: ollamaTunnelHeaders(ollamaHost),
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        format: "json",
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json(
      { error: `Could not reach the inference server at ${ollamaHost}. ${msg}` },
      { status: 502 }
    );
  }

  const rawText = await ollamaRes.text();
  if (!ollamaRes.ok) {
    if (responseLooksLikeHtml(rawText)) {
      return NextResponse.json(
        {
          error: `The inference server returned HTTP ${ollamaRes.status} with an HTML page instead of JSON.`,
          hint: "Check the base URL, tunnel, and that the inference service is running.",
          rawSnippet: rawText.slice(0, 400),
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: `Inference server error (${ollamaRes.status}): ${rawText || ollamaRes.statusText}` },
      { status: 502 }
    );
  }

  const parsedBody = parseOllamaGenerateResponse(rawText);
  if (!parsedBody.ok) {
    return NextResponse.json(
      {
        error: parsedBody.error,
        rawSnippet: parsedBody.rawSnippet,
        model: ollamaModel,
      },
      { status: 502 }
    );
  }

  const responseText = parsedBody.responseText;

  if (!responseText.trim()) {
    return NextResponse.json(
      {
        error: "The inference server returned an empty response.",
        rawResponse: rawText,
        model: ollamaModel,
      },
      { status: 502 }
    );
  }

  const extracted = extractJsonObject(responseText);
  let parsed: import("@/lib/types/analysis").ParsedAnalysis | null = null;
  let parseError: string | undefined;

  if (extracted) {
    parsed = coerceParsedAnalysis(extracted);
  }
  if (!parsed) {
    parseError =
      "The model response could not be parsed as the expected JSON schema. Showing the raw output only.";
  }

  if (stableDealId) {
    try {
      await indexDealUploads({
        dealId: stableDealId,
        buyerText,
        sellerText,
        ollamaHost,
      });
    } catch (e) {
      console.warn("[rag] deal upload indexing failed:", e);
    }
  }

  return NextResponse.json({
    rawResponse: responseText,
    parsed,
    parseError,
    model: ollamaModel,
    analyzedAt: new Date().toISOString(),
    buyerDocumentText: buyerText,
    sellerDocumentText: sellerText,
  });
}
