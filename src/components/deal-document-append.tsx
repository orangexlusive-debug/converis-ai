"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { populateAnalyzeFormData } from "@/lib/build-analyze-form-data";
import { DOCUMENT_ACCEPT } from "@/lib/document-extract";
import { coerceParsedAnalysis } from "@/lib/extract-json";
import { mergeUniqueFiles } from "@/lib/merge-upload-files";
import type { Deal } from "@/lib/types/deal";
import { useDeals } from "@/providers/deals-provider";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import type { RefObject } from "react";
import { useRef, useState } from "react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SideUploader({
  label,
  inputId,
  files,
  inputRef,
  onAdded,
  onRemove,
}: {
  label: string;
  inputId: string;
  files: File[];
  inputRef: RefObject<HTMLInputElement | null>;
  onAdded: (picked: File[]) => void;
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
          if (next.length) onAdded(next);
          e.target.value = "";
        }}
      />
      {files.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-5 text-center text-xs text-muted-foreground">
          No new files queued for this side.
        </p>
      ) : (
        <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${f.lastModified}-${i}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white/[0.04]"
            >
              <span className="min-w-0 flex-1 truncate" title={f.name}>
                {f.name}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{formatSize(f.size)}</span>
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
    </div>
  );
}

export function DealDocumentAppendPanel({ deal }: { deal: Deal }) {
  const { settings, updateDeal } = useDeals();
  const [buyerFiles, setBuyerFiles] = useState<File[]>([]);
  const [sellerFiles, setSellerFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buyerRef = useRef<HTMLInputElement>(null);
  const sellerRef = useRef<HTMLInputElement>(null);

  const hasCachedExtractedText =
    Boolean(deal.buyerDocumentText?.trim()) || Boolean(deal.sellerDocumentText?.trim());
  const hasNewFiles = buyerFiles.length > 0 || sellerFiles.length > 0;

  const onSubmit = async () => {
    if (!hasNewFiles || loading) return;
    setLoading(true);
    setError(null);

    const form = new FormData();
    populateAnalyzeFormData(form, {
      dealId: deal.id,
      dealName: deal.name,
      industry: deal.industry,
      buyerIndustry: deal.buyerIndustry,
      sellerIndustry: deal.sellerIndustry,
      technologyBusinessTypeIds: deal.technologyBusinessTypeIds,
      bankingBusinessTypeIds: deal.bankingBusinessTypeIds,
      healthcareBusinessTypeIds: deal.healthcareBusinessTypeIds,
      ollamaHost: settings.ollamaHost,
      ollamaModel: settings.ollamaModel,
      priorBuyerDocumentText: deal.buyerDocumentText,
      priorSellerDocumentText: deal.sellerDocumentText,
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
        return;
      }

      updateDeal(deal.id, {
        ...(typeof data.buyerDocumentText === "string" ? { buyerDocumentText: data.buyerDocumentText } : {}),
        ...(typeof data.sellerDocumentText === "string" ? { sellerDocumentText: data.sellerDocumentText } : {}),
        buyerFileNames: [...deal.buyerFileNames, ...buyerFiles.map((f) => f.name)],
        sellerFileNames: [...deal.sellerFileNames, ...sellerFiles.map((f) => f.name)],
        analysis: {
          rawResponse: data.rawResponse ?? "",
          parsed,
          parseError: data.parseError,
          model: data.model ?? settings.ollamaModel,
          analyzedAt: data.analyzedAt ?? new Date().toISOString(),
        },
      });
      setBuyerFiles([]);
      setSellerFiles([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-cyan-500/12 bg-black/25">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Documents</CardTitle>
        <CardDescription>
          Attach additional buyer or seller files and run analysis again. Prior uploads stay in scope when cached
          text is available from the last successful run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {deal.analysis && !hasCachedExtractedText ?
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
            This deal was saved before incremental uploads were enabled, so extracted text isn&apos;t cached yet.
            When you run this once, upload <span className="font-medium text-amber-50">every document you want in
            scope</span> (earlier uploads plus new ones). Later runs only need new files added here.
          </p>
        : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Buyer — already analyzed
            </p>
            {deal.buyerFileNames.length === 0 ?
              <p className="text-xs text-muted-foreground">None recorded</p>
            : <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-md border border-white/[0.06] bg-black/40 p-2 text-xs text-muted-foreground">
                {deal.buyerFileNames.map((name, i) => (
                  <li key={`${name}-${i}`} className="truncate" title={name}>
                    {name}
                  </li>
                ))}
              </ul>
            }
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Seller — already analyzed
            </p>
            {deal.sellerFileNames.length === 0 ?
              <p className="text-xs text-muted-foreground">None recorded</p>
            : <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-md border border-white/[0.06] bg-black/40 p-2 text-xs text-muted-foreground">
                {deal.sellerFileNames.map((name, i) => (
                  <li key={`${name}-${i}`} className="truncate" title={name}>
                    {name}
                  </li>
                ))}
              </ul>
            }
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SideUploader
            label="New buyer uploads"
            inputId={`append-buyer-${deal.id}`}
            files={buyerFiles}
            inputRef={buyerRef}
            onAdded={(added) => setBuyerFiles((prev) => mergeUniqueFiles(prev, added))}
            onRemove={(i) => setBuyerFiles((prev) => prev.filter((_, idx) => idx !== i))}
          />
          <SideUploader
            label="New seller uploads"
            inputId={`append-seller-${deal.id}`}
            files={sellerFiles}
            inputRef={sellerRef}
            onAdded={(added) => setSellerFiles((prev) => mergeUniqueFiles(prev, added))}
            onRemove={(i) => setSellerFiles((prev) => prev.filter((_, idx) => idx !== i))}
          />
        </div>

        {error ?
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
        : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={!hasNewFiles || loading}
            onClick={() => void onSubmit()}
            className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_24px_-8px_rgba(56,189,248,0.35)] hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500"
          >
            {loading ?
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Re-analyzing…
              </>
            : <>
                Merge new documents &amp; re-analyze
              </>
            }
          </Button>
          {!hasNewFiles ?
            <p className="text-xs text-muted-foreground">Choose at least one new file above.</p>
          : null}
        </div>
      </CardContent>
    </Card>
  );
}
