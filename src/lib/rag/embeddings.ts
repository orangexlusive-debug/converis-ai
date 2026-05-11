import { normalizeOllamaHost } from "@/lib/ollama-config";
import { ollamaTunnelHeaders } from "@/lib/ollama-http";

export type Embedder = {
  embedTexts: (texts: string[]) => Promise<number[][]>;
};

type OllamaEmbedResponse = {
  embedding?: number[];
  embeddings?: number[][];
};

function embedModelName(): string {
  return (process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text").trim() || "nomic-embed-text";
}

/**
 * Fully-local embeddings via the same inference host.
 * Uses Ollama-compatible `/api/embeddings`.
 */
export function createLocalEmbedder(ollamaHostRaw?: string | null): Embedder {
  const host = normalizeOllamaHost(ollamaHostRaw ?? process.env.OLLAMA_HOST ?? "");
  const model = embedModelName();

  return {
    async embedTexts(texts: string[]) {
      const out: number[][] = [];
      for (const t of texts) {
        const res = await fetch(`${host}/api/embeddings`, {
          method: "POST",
          headers: { ...ollamaTunnelHeaders(host), Accept: "application/json" },
          body: JSON.stringify({ model, prompt: t }),
        });
        const raw = (await res.text()).trim();
        if (!res.ok) {
          throw new Error(`Embeddings failed (${res.status}). ${raw.slice(0, 200)}`);
        }
        let parsed: OllamaEmbedResponse = {};
        try {
          parsed = JSON.parse(raw) as OllamaEmbedResponse;
        } catch {
          parsed = {};
        }
        const vec = Array.isArray(parsed.embedding) ? parsed.embedding : null;
        if (!vec) {
          throw new Error("Embeddings response missing 'embedding' vector.");
        }
        out.push(vec);
      }
      return out;
    },
  };
}

