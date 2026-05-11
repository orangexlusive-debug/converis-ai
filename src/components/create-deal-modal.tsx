"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BankingBusinessTypePicker } from "@/components/banking-business-type-picker";
import { HealthcareBusinessTypePicker } from "@/components/healthcare-business-type-picker";
import { TechnologyBusinessTypePicker } from "@/components/technology-business-type-picker";
import { DOCUMENT_ACCEPT } from "@/lib/document-extract";
import { coerceParsedAnalysis } from "@/lib/extract-json";
import { nanoid } from "nanoid";
import { populateAnalyzeFormData } from "@/lib/build-analyze-form-data";
import { INDUSTRIES } from "@/lib/industries";
import { mergeUniqueFiles } from "@/lib/merge-upload-files";
import { BANKING_INDUSTRY } from "@/lib/banking-business-types";
import { HEALTHCARE_INDUSTRY } from "@/lib/healthcare-business-types";
import { TECHNOLOGY_INDUSTRY } from "@/lib/technology-business-types";
import { useDeals } from "@/providers/deals-provider";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Stable placeholder value so Select stays controlled (never `undefined`). */
const INDUSTRY_NONE = "__industry_none__";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentStack({
  label,
  inputId,
  files,
  inputRef,
  onFilesAdded,
  onRemove,
}: {
  label: string;
  inputId: string;
  files: File[];
  inputRef: RefObject<HTMLInputElement | null>;
  onFilesAdded: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={inputId}>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => inputRef.current?.click()}
        >
          <PlusIcon className="size-3.5" />
          Add files
        </Button>
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const next = Array.from(e.target.files ?? []);
          if (next.length) onFilesAdded(next);
          e.target.value = "";
        }}
      />
      {files.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-6 text-center text-xs text-muted-foreground">
          No files yet. Use <span className="text-foreground/80">Add files</span> — you can attach
          multiple times.
        </p>
      ) : (
        <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${f.lastModified}-${i}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.04]"
            >
              <span className="min-w-0 flex-1 truncate text-xs" title={f.name}>
                {f.name}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                {formatSize(f.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${f.name}`}
              >
                <XIcon className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        PDF and plain-text documents (.txt, .md, .csv, .json, .xml, …). Duplicate picks (same name,
        size, and date) are skipped.
      </p>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateDealModal({ open, onOpenChange }: Props) {
  const { addDeal, updateDeal, settings, setSelectedIndustry } = useDeals();
  const [dealName, setDealName] = useState("");
  const [buyerIndustry, setBuyerIndustry] = useState<string>(INDUSTRY_NONE);
  const [sellerIndustry, setSellerIndustry] = useState<string>(INDUSTRY_NONE);
  const [analysisIndustry, setAnalysisIndustry] = useState<string>(INDUSTRY_NONE);
  const [buyerFiles, setBuyerFiles] = useState<File[]>([]);
  const [sellerFiles, setSellerFiles] = useState<File[]>([]);
  const [techBusinessTypeIds, setTechBusinessTypeIds] = useState<string[]>([]);
  const [bankingBusinessTypeIds, setBankingBusinessTypeIds] = useState<string[]>([]);
  const [healthcareBusinessTypeIds, setHealthcareBusinessTypeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buyerInputRef = useRef<HTMLInputElement>(null);
  const sellerInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setDealName("");
    setBuyerIndustry(INDUSTRY_NONE);
    setSellerIndustry(INDUSTRY_NONE);
    setAnalysisIndustry(INDUSTRY_NONE);
    setBuyerFiles([]);
    setSellerFiles([]);
    setTechBusinessTypeIds([]);
    setBankingBusinessTypeIds([]);
    setHealthcareBusinessTypeIds([]);
    setError(null);
    setLoading(false);
  }, []);

  const resolvedBuyerIndustry =
    buyerIndustry !== INDUSTRY_NONE &&
    INDUSTRIES.includes(buyerIndustry as (typeof INDUSTRIES)[number])
      ? buyerIndustry
      : null;

  const resolvedSellerIndustry =
    sellerIndustry !== INDUSTRY_NONE &&
    INDUSTRIES.includes(sellerIndustry as (typeof INDUSTRIES)[number])
      ? sellerIndustry
      : null;

  const resolvedAnalysisIndustry =
    analysisIndustry !== INDUSTRY_NONE &&
    INDUSTRIES.includes(analysisIndustry as (typeof INDUSTRIES)[number])
      ? analysisIndustry
      : null;

  useEffect(() => {
    if (!resolvedBuyerIndustry || !resolvedSellerIndustry) return;
    if (resolvedBuyerIndustry === resolvedSellerIndustry) {
      setAnalysisIndustry(resolvedBuyerIndustry);
      return;
    }
    if (!resolvedAnalysisIndustry) {
      setAnalysisIndustry(resolvedBuyerIndustry);
      setTechBusinessTypeIds([]);
      setBankingBusinessTypeIds([]);
      setHealthcareBusinessTypeIds([]);
    }
  }, [resolvedBuyerIndustry, resolvedSellerIndustry, resolvedAnalysisIndustry]);

  const techTypesSatisfied =
    resolvedAnalysisIndustry !== TECHNOLOGY_INDUSTRY || techBusinessTypeIds.length > 0;

  const bankingTypesSatisfied =
    resolvedAnalysisIndustry !== BANKING_INDUSTRY || bankingBusinessTypeIds.length > 0;

  const healthcareTypesSatisfied =
    resolvedAnalysisIndustry !== HEALTHCARE_INDUSTRY || healthcareBusinessTypeIds.length > 0;

  const canAnalyze =
    dealName.trim().length > 0 &&
    resolvedBuyerIndustry !== null &&
    resolvedSellerIndustry !== null &&
    resolvedAnalysisIndustry !== null &&
    techTypesSatisfied &&
    bankingTypesSatisfied &&
    healthcareTypesSatisfied &&
    (buyerFiles.length > 0 || sellerFiles.length > 0);

  const onAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError(null);

    const dealId = nanoid();
    const form = new FormData();
    populateAnalyzeFormData(form, {
      dealId,
      dealName: dealName.trim(),
      industry: resolvedAnalysisIndustry!,
      buyerIndustry: resolvedBuyerIndustry!,
      sellerIndustry: resolvedSellerIndustry!,
      technologyBusinessTypeIds:
        resolvedAnalysisIndustry === TECHNOLOGY_INDUSTRY ? [...techBusinessTypeIds] : undefined,
      bankingBusinessTypeIds:
        resolvedAnalysisIndustry === BANKING_INDUSTRY ? [...bankingBusinessTypeIds] : undefined,
      healthcareBusinessTypeIds:
        resolvedAnalysisIndustry === HEALTHCARE_INDUSTRY ? [...healthcareBusinessTypeIds] : undefined,
      ollamaHost: settings.ollamaHost,
      ollamaModel: settings.ollamaModel,
      buyerFiles,
      sellerFiles,
    });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        error?: string;
        rawResponse?: string;
        parsed?: unknown;
        parseError?: string;
        model?: string;
        analyzedAt?: string;
        buyerDocumentText?: string;
        sellerDocumentText?: string;
      };
      const parsed = coerceParsedAnalysis(data.parsed);

      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        setLoading(false);
        return;
      }

      const deal = addDeal({
        id: dealId,
        name: dealName.trim(),
        industry: resolvedAnalysisIndustry!,
        buyerIndustry: resolvedBuyerIndustry!,
        sellerIndustry: resolvedSellerIndustry!,
        technologyBusinessTypeIds:
          resolvedAnalysisIndustry === TECHNOLOGY_INDUSTRY ? [...techBusinessTypeIds] : undefined,
        bankingBusinessTypeIds:
          resolvedAnalysisIndustry === BANKING_INDUSTRY ? [...bankingBusinessTypeIds] : undefined,
        healthcareBusinessTypeIds:
          resolvedAnalysisIndustry === HEALTHCARE_INDUSTRY ? [...healthcareBusinessTypeIds] : undefined,
        buyerFileNames: buyerFiles.map((f) => f.name),
        sellerFileNames: sellerFiles.map((f) => f.name),
        chatMessages: [],
      });

      updateDeal(deal.id, {
        ...(typeof data.buyerDocumentText === "string" ? { buyerDocumentText: data.buyerDocumentText } : {}),
        ...(typeof data.sellerDocumentText === "string" ? { sellerDocumentText: data.sellerDocumentText } : {}),
        analysis: {
          rawResponse: data.rawResponse ?? "",
          parsed,
          parseError: data.parseError,
          model: data.model ?? settings.ollamaModel,
          analyzedAt: data.analyzedAt ?? new Date().toISOString(),
        },
      });

      setSelectedIndustry(resolvedAnalysisIndustry!);
      onOpenChange(false);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create new deal</DialogTitle>
          <DialogDescription>
            Add buyer and seller documents in multiple batches (PDFs and plain-text files). For
            Technology, Banking, or Healthcare, pick business types (labels only; definitions go to
            your model).
            Analysis runs entirely against your private inference endpoint — no external APIs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label htmlFor="deal-name">Deal name</Label>
            <Input
              id="deal-name"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              placeholder="e.g. Project Northstar"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Buyer industry (required)</Label>
              <Select value={buyerIndustry} onValueChange={(v) => setBuyerIndustry(v ?? INDUSTRY_NONE)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={INDUSTRY_NONE} className="text-muted-foreground">
                    Select an industry
                  </SelectItem>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Seller industry (required)</Label>
              <Select value={sellerIndustry} onValueChange={(v) => setSellerIndustry(v ?? INDUSTRY_NONE)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={INDUSTRY_NONE} className="text-muted-foreground">
                    Select an industry
                  </SelectItem>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {resolvedBuyerIndustry &&
            resolvedSellerIndustry &&
            resolvedBuyerIndustry !== resolvedSellerIndustry && (
              <div className="grid gap-2">
                <Label>Analysis framework industry (required)</Label>
                <p className="text-xs text-muted-foreground">
                  Buyer and seller industries differ. Pick which industry should drive the analysis
                  framework and business-type labels.
                </p>
                <Select
                  value={analysisIndustry}
                  onValueChange={(v) => {
                    setAnalysisIndustry(v ?? INDUSTRY_NONE);
                    setTechBusinessTypeIds([]);
                    setBankingBusinessTypeIds([]);
                    setHealthcareBusinessTypeIds([]);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={INDUSTRY_NONE} className="text-muted-foreground">
                      Choose analysis industry
                    </SelectItem>
                    {[resolvedBuyerIndustry, resolvedSellerIndustry].map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          {resolvedAnalysisIndustry === TECHNOLOGY_INDUSTRY && (
            <TechnologyBusinessTypePicker
              selectedIds={techBusinessTypeIds}
              onChange={setTechBusinessTypeIds}
            />
          )}

          {resolvedAnalysisIndustry === BANKING_INDUSTRY && (
            <BankingBusinessTypePicker
              selectedIds={bankingBusinessTypeIds}
              onChange={setBankingBusinessTypeIds}
            />
          )}

          {resolvedAnalysisIndustry === HEALTHCARE_INDUSTRY && (
            <HealthcareBusinessTypePicker
              selectedIds={healthcareBusinessTypeIds}
              onChange={setHealthcareBusinessTypeIds}
            />
          )}

          <DocumentStack
            label="Buyer documents"
            inputId="buyer-docs-input"
            files={buyerFiles}
            inputRef={buyerInputRef}
            onFilesAdded={(added) => setBuyerFiles((prev) => mergeUniqueFiles(prev, added))}
            onRemove={(i) => setBuyerFiles((prev) => prev.filter((_, idx) => idx !== i))}
          />

          <DocumentStack
            label="Seller documents"
            inputId="seller-docs-input"
            files={sellerFiles}
            inputRef={sellerInputRef}
            onFilesAdded={(added) => setSellerFiles((prev) => mergeUniqueFiles(prev, added))}
            onRemove={(i) => setSellerFiles((prev) => prev.filter((_, idx) => idx !== i))}
          />

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_24px_-8px_rgba(56,189,248,0.45)] hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500"
            disabled={!canAnalyze || loading}
            onClick={onAnalyze}
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
