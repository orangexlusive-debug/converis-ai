"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { buildDealContextBlock, useDeals } from "@/providers/deals-provider";
import { Loader2Icon, SendHorizonalIcon } from "lucide-react";
import { useMemo, useState } from "react";

export function ChatPanel() {
  const { deals, selectedDealId, settings, appendChat } = useDeals();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deal = useMemo(
    () => deals.find((d) => d.id === selectedDealId) ?? null,
    [deals, selectedDealId]
  );

  const send = async () => {
    const text = input.trim();
    if (!deal || !text || loading) return;

    setLoading(true);
    setError(null);
    const messages = [...deal.chatMessages, { role: "user" as const, content: text }];
    appendChat(deal.id, "user", text);
    setInput("");
    const dealContext = buildDealContextBlock(deal, deal.analysis?.parsed ?? null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          ollamaHost: settings.ollamaHost,
          ollamaModel: settings.ollamaModel,
          dealContext,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error || `Chat failed (${res.status})`);
        return;
      }

      if (data.message) {
        appendChat(deal.id, "assistant", data.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!deal) {
    return (
      <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-cyan-500/12 bg-black/60 backdrop-blur-xl supports-backdrop-filter:bg-black/45">
        <div className="border-b border-cyan-500/12 px-4 py-4">
          <p className="text-sm font-medium">Assistant</p>
          <p className="text-xs text-muted-foreground">Local Ollama · same session context</p>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Select a deal to chat with the assistant about its integration context.
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-cyan-500/12 bg-black/60 backdrop-blur-xl supports-backdrop-filter:bg-black/45">
      <div className="border-b border-cyan-500/12 px-4 py-4">
        <p className="text-sm font-medium">Assistant</p>
        <p className="truncate text-xs text-muted-foreground" title={deal.name}>
          {deal.name}
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3">
        <div className="flex flex-col gap-3 py-4">
          {deal.chatMessages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Ask follow-ups about risks, timeline, or remediation. Responses come only from your
              Ollama model.
            </p>
          )}
          {deal.chatMessages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={
                m.role === "user"
                  ? "ml-6 rounded-lg bg-sky-500/15 px-3 py-2 text-sm text-foreground ring-1 ring-cyan-400/25"
                  : "mr-6 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-muted-foreground ring-1 ring-cyan-500/10"
              }
            >
              {m.content}
            </div>
          ))}
        </div>
      </ScrollArea>

      {error && (
        <div className="mx-3 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </div>
      )}

      <div className="border-t border-cyan-500/12 p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this deal…"
            className="min-h-[72px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button
            size="icon-lg"
            className="shrink-0 bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-[0_0_20px_-6px_rgba(56,189,248,0.5)]"
            disabled={loading || !input.trim()}
            onClick={() => void send()}
          >
            {loading ? <Loader2Icon className="size-4 animate-spin" /> : <SendHorizonalIcon />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
