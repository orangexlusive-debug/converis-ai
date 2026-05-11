"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Deal } from "@/lib/types/deal";
import { useDeals } from "@/providers/deals-provider";
import { TrashIcon } from "lucide-react";
import { useState } from "react";

export function AdminDealsSection() {
  const { deals, deleteDeal } = useDeals();
  const [confirmDeal, setConfirmDeal] = useState<Deal | null>(null);

  return (
    <>
      <div className="mt-14 border-t border-cyan-500/15 pt-12">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Integration deals (local)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved in this browser only. Deleting removes analysis, chats, and document cache for that deal —
            not recoverable.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-cyan-500/15 bg-black/40 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">Deal</th>
                  <th className="px-4 py-3 font-medium">Industry</th>
                  <th className="px-4 py-3 font-medium">Analysis</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ?
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No deals saved in this browser yet.
                    </td>
                  </tr>
                : [...deals]
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((deal) => (
                      <tr
                        key={deal.id}
                        className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                      >
                        <td className="max-w-[220px] px-4 py-3">
                          <span className="line-clamp-2 font-medium text-foreground/90" title={deal.name}>
                            {deal.name}
                          </span>
                          <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground opacity-70">
                            {deal.id}
                          </div>
                        </td>
                        <td className="px-4 py-3">{deal.industry}</td>
                        <td className="px-4 py-3">
                          {deal.analysis ?
                            new Date(deal.analysis.analyzedAt).toLocaleDateString()
                          : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(deal.updatedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-400/90 hover:text-red-300"
                            aria-label={`Delete deal ${deal.name}`}
                            onClick={() => setConfirmDeal(deal)}
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={confirmDeal !== null} onOpenChange={(open) => !open && setConfirmDeal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete deal?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes{" "}
            <span className="font-medium text-foreground">&quot;{confirmDeal?.name ?? ""}&quot;</span> from
            local storage in this browser, including chats and cached extracts for uploads/RAG.
          </p>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" type="button" onClick={() => setConfirmDeal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              className="bg-red-600 hover:bg-red-500"
              onClick={() => {
                if (confirmDeal) deleteDeal(confirmDeal.id);
                setConfirmDeal(null);
              }}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
