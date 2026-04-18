"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const STAGES = [
  "LEAD",
  "DEMO_REQUESTED",
  "DEMO_SCHEDULED",
  "DEMO_DONE",
  "PROPOSAL_SENT",
  "NEGOTIATING",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

type Deal = {
  id: string;
  companyName: string;
  stage: string;
  estimatedValue: number;
  probability: number;
  nextAction: string;
  assignedTo: { name: string } | null;
  stageEnteredAt: string;
};

function formatStage(s: string) {
  return s.replace(/_/g, " ");
}

function DroppableColumn({
  stage,
  children,
}: {
  stage: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[420px] w-64 shrink-0 flex-col rounded-xl border bg-black/40 p-2 ${
        isOver ? "border-[#7C3AED]/50 ring-1 ring-[#7C3AED]/30" : "border-white/[0.08]"
      }`}
    >
      <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-[#93C5FD] uppercase">
        {formatStage(stage)}
      </p>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">{children}</div>
    </div>
  );
}

function DealCard({ deal, onOpen }: { deal: Deal; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(deal.stageEnteredAt).getTime()) / 86400000)
  );
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded-lg border border-white/[0.08] bg-white/[0.04] p-3 text-xs active:cursor-grabbing"
    >
      <button
        type="button"
        className="w-full text-left font-semibold text-white hover:text-[#93C5FD]"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(deal.id);
        }}
      >
        {deal.companyName}
      </button>
      <p className="mt-1 text-muted-foreground">
        ${deal.estimatedValue.toLocaleString()} · {deal.probability}%
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {deal.assignedTo?.name ?? "Unassigned"} · {days}d in stage
      </p>
      {deal.nextAction && (
        <p className="mt-1 text-[10px] text-[#C4B5FD]">Next: {deal.nextAction}</p>
      )}
    </div>
  );
}

export function CrmPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [filters, setFilters] = useState({ assigned: "", industry: "", min: "", max: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ companyName: "", estimatedValue: "", probability: "20" });
  const [detailId, setDetailId] = useState<string | null>(null);
  type DealDetail = {
    id: string;
    companyName: string;
    stage: string;
    estimatedValue: number;
    probability: number;
    nextAction: string;
    assignedTo: { id: string; name: string; email: string } | null;
    client: { companyName: string; industry: string } | null;
  };
  const [detail, setDetail] = useState<DealDetail | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (filters.assigned) q.set("assigned", filters.assigned);
    if (filters.industry) q.set("industry", filters.industry);
    if (filters.min) q.set("minValue", filters.min);
    if (filters.max) q.set("maxValue", filters.max);
    const res = await fetch(`/api/crm/deals?${q}`, { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { deals: Deal[]; pipelineValue: number };
    setDeals(data.deals);
    setPipelineValue(data.pipelineValue);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const byStage = useMemo(() => {
    const m = new Map<string, Deal[]>();
    for (const s of STAGES) m.set(s, []);
    for (const d of deals) {
      const list = m.get(d.stage) ?? [];
      list.push(d);
      m.set(d.stage, list);
    }
    return m;
  }, [deals]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/crm/deals/${detailId}`, { credentials: "include" });
      if (!res.ok || cancelled) return;
      const j = (await res.json()) as { deal: DealDetail };
      if (!cancelled) setDetail(j.deal);
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  async function onDragEnd(e: DragEndEvent) {
    const dealId = e.active.id as string;
    const overId = e.over?.id as string | undefined;
    if (!overId || !STAGES.includes(overId as (typeof STAGES)[number])) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === overId) return;
    const res = await fetch(`/api/crm/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ stage: overId }),
    });
    if (res.ok) void load();
  }

  async function createDeal() {
    const res = await fetch("/api/crm/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        companyName: newDeal.companyName,
        estimatedValue: Number(newDeal.estimatedValue || 0),
        probability: Number(newDeal.probability || 20),
      }),
    });
    if (res.ok) {
      setAddOpen(false);
      setNewDeal({ companyName: "", estimatedValue: "", probability: "20" });
      void load();
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Open pipeline value:{" "}
            <span className="bg-gradient-to-r from-[#60A5FA] to-[#C4B5FD] bg-clip-text font-semibold text-transparent">
              ${Math.round(pipelineValue).toLocaleString()}
            </span>
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon className="size-4" />
          Add deal
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Assigned user id"
          value={filters.assigned}
          onChange={(e) => setFilters({ ...filters, assigned: e.target.value })}
          className="h-9 w-48 border-white/10 bg-black/50 text-xs"
        />
        <Input
          placeholder="Industry (client)"
          value={filters.industry}
          onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
          className="h-9 w-44 border-white/10 bg-black/50 text-xs"
        />
        <Input
          placeholder="Min value"
          value={filters.min}
          onChange={(e) => setFilters({ ...filters, min: e.target.value })}
          className="h-9 w-28 border-white/10 bg-black/50 text-xs"
        />
        <Input
          placeholder="Max value"
          value={filters.max}
          onChange={(e) => setFilters({ ...filters, max: e.target.value })}
          className="h-9 w-28 border-white/10 bg-black/50 text-xs"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <DroppableColumn key={stage} stage={stage}>
              {(byStage.get(stage) ?? []).map((d) => (
                <DealCard key={d.id} deal={d} onOpen={(id) => setDetailId(id)} />
              ))}
            </DroppableColumn>
          ))}
        </div>
      </DndContext>

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl transition-transform duration-200",
          detailId ? "translate-x-0" : "translate-x-full"
        )}
      >
        {detail && (
          <div className="flex h-full flex-col p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">{detail.companyName}</h2>
                <p className="text-xs text-muted-foreground">{formatStage(detail.stage)}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setDetailId(null)}>
                Close
              </Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto text-sm">
              <p>
                <span className="text-muted-foreground">Value:</span> $
                {detail.estimatedValue.toLocaleString()}
              </p>
              <p>
                <span className="text-muted-foreground">Probability:</span> {detail.probability}%
              </p>
              <p>
                <span className="text-muted-foreground">Assigned:</span>{" "}
                {detail.assignedTo?.name ?? "Unassigned"}
              </p>
              {detail.client && (
                <p>
                  <span className="text-muted-foreground">Linked client:</span>{" "}
                  {detail.client.companyName} ({detail.client.industry})
                </p>
              )}
              <div>
                <Label>Next action</Label>
                <textarea
                  key={detail.id}
                  className="mt-1 min-h-[80px] w-full rounded-lg border border-white/10 bg-black/50 p-2 text-sm"
                  defaultValue={detail.nextAction}
                  onBlur={async (e) => {
                    await fetch(`/api/crm/deals/${detail.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ nextAction: e.target.value }),
                    });
                    void load();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {detailId && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50"
          aria-label="Close panel"
          onClick={() => setDetailId(null)}
        />
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-black p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">New deal</h2>
            <div className="space-y-3">
              <div>
                <Label>Company</Label>
                <Input
                  className="mt-1 border-white/10 bg-black/50"
                  value={newDeal.companyName}
                  onChange={(e) => setNewDeal({ ...newDeal, companyName: e.target.value })}
                />
              </div>
              <div>
                <Label>Estimated value</Label>
                <Input
                  type="number"
                  className="mt-1 border-white/10 bg-black/50"
                  value={newDeal.estimatedValue}
                  onChange={(e) => setNewDeal({ ...newDeal, estimatedValue: e.target.value })}
                />
              </div>
              <div>
                <Label>Probability %</Label>
                <Input
                  type="number"
                  className="mt-1 border-white/10 bg-black/50"
                  value={newDeal.probability}
                  onChange={(e) => setNewDeal({ ...newDeal, probability: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
                onClick={() => void createDeal()}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
