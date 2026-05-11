import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";
import { chunkText } from "@/lib/rag/chunking";
import { loadKnowledgeBaseDocuments } from "@/lib/rag/kb-loader";
import { createLocalEmbedder } from "@/lib/rag/embeddings";

const ManifestSchema = z.object({
  version: z.number(),
  chunkSize: z.number(),
  chunkOverlap: z.number(),
  files: z.array(
    z.object({
      relPath: z.string(),
      mtimeMs: z.number(),
      size: z.number(),
    })
  ),
});
type Manifest = z.infer<typeof ManifestSchema>;

type Row = {
  id: string;
  vector: number[];
  text: string;
  relPath: string;
  ext: string;
  chunkIndex: number;
};

export type RetrievalHit = {
  text: string;
  relPath: string;
  score: number;
  /** `kb`: knowledge_base folder. `upload`: buyer/seller PDFs indexed when the deal was analyzed. */
  source: "kb" | "upload";
};

function ragDir() {
  return path.join(process.cwd(), ".rag");
}

function manifestPath() {
  return path.join(ragDir(), "kb-manifest.json");
}

function vectorsPath() {
  return path.join(ragDir(), "kb-vectors.json");
}

function dealsDir(dealId: string) {
  return path.join(ragDir(), "deals", dealId);
}

function dealVectorsPath(dealId: string) {
  return path.join(dealsDir(dealId), "vectors.json");
}

function cfg() {
  const chunkSize = Number(process.env.RAG_CHUNK_SIZE ?? 1000);
  const chunkOverlap = Number(process.env.RAG_CHUNK_OVERLAP ?? 200);
  const topK = Number(process.env.RAG_TOP_K ?? 8);
  return {
    chunkSize: Number.isFinite(chunkSize) ? chunkSize : 1000,
    chunkOverlap: Number.isFinite(chunkOverlap) ? chunkOverlap : 200,
    topK: Number.isFinite(topK) ? topK : 8,
  };
}

async function readManifest(): Promise<Manifest | null> {
  try {
    const raw = await fs.readFile(manifestPath(), "utf8");
    const parsed = ManifestSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function writeManifest(m: Manifest) {
  await fs.mkdir(ragDir(), { recursive: true });
  await fs.writeFile(manifestPath(), JSON.stringify(m, null, 2), "utf8");
}

const VectorsSchema = z.object({
  version: z.number(),
  rows: z.array(
    z.object({
      id: z.string(),
      vector: z.array(z.number()),
      text: z.string(),
      relPath: z.string(),
      ext: z.string(),
      chunkIndex: z.number(),
    })
  ),
});

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function readVectorsFile(): Promise<Row[]> {
  try {
    const raw = await fs.readFile(vectorsPath(), "utf8");
    const parsed = VectorsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return (parsed.data.rows ?? []) as unknown as Row[];
  } catch {
    return [];
  }
}

async function writeVectorsFile(rows: Row[]) {
  await fs.mkdir(ragDir(), { recursive: true });
  await fs.writeFile(vectorsPath(), JSON.stringify({ version: 1, rows }, null, 2), "utf8");
}

async function readDealVectorsFile(dealId: string): Promise<Row[]> {
  try {
    const raw = await fs.readFile(dealVectorsPath(dealId), "utf8");
    const parsed = VectorsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return (parsed.data.rows ?? []) as unknown as Row[];
  } catch {
    return [];
  }
}

async function writeDealVectorsFile(dealId: string, rows: Row[]) {
  await fs.mkdir(dealsDir(dealId), { recursive: true });
  await fs.writeFile(dealVectorsPath(dealId), JSON.stringify({ version: 1, rows }, null, 2), "utf8");
}

function sameFiles(a: Manifest, b: Manifest): boolean {
  if (a.version !== b.version) return false;
  if (a.chunkSize !== b.chunkSize) return false;
  if (a.chunkOverlap !== b.chunkOverlap) return false;
  if (a.files.length !== b.files.length) return false;
  const key = (f: Manifest["files"][number]) => `${f.relPath}::${f.mtimeMs}::${f.size}`;
  const as = new Set(a.files.map(key));
  for (const f of b.files) {
    if (!as.has(key(f))) return false;
  }
  return true;
}

/**
 * Builds / refreshes the KB vector index if files changed.
 * This is called lazily from API routes and is safe to call repeatedly.
 */
export async function ensureKnowledgeBaseIndex(opts?: { ollamaHost?: string | null }) {
  const { chunkSize, chunkOverlap } = cfg();
  const docs = await loadKnowledgeBaseDocuments();
  /** Bump when index row shape / relPath rules change (forces rebuild). */
  const nextManifest: Manifest = {
    version: 2,
    chunkSize,
    chunkOverlap,
    files: docs.map((d) => ({ relPath: d.relPath, mtimeMs: d.mtimeMs, size: d.size })),
  };

  const existing = await readManifest();
  if (existing && sameFiles(existing, nextManifest)) return;

  await fs.mkdir(ragDir(), { recursive: true });

  const embedder = createLocalEmbedder(opts?.ollamaHost ?? null);
  const rows: Row[] = [];

  for (const doc of docs) {
    const chunks = chunkText(doc.text, chunkSize, chunkOverlap);
    for (let i = 0; i < chunks.length; i++) {
      const id = `${doc.relPath}::${i}`;
      rows.push({
        id,
        vector: [], // fill after embedding
        text: chunks[i]!.text,
        relPath: `kb/${doc.relPath}`,
        ext: doc.ext,
        chunkIndex: i,
      });
    }
  }

  if (rows.length === 0) {
    await writeVectorsFile([]);
    await writeManifest(nextManifest);
    return;
  }

  // Embed in small batches to avoid large payloads.
  const batchSize = 16;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const vecs = await embedder.embedTexts(batch.map((r) => r.text));
    for (let j = 0; j < batch.length; j++) {
      batch[j]!.vector = vecs[j]!;
    }
  }

  await writeVectorsFile(rows);

  await writeManifest(nextManifest);
}

function rankRows(rows: Row[], queryVec: number[], topK: number, minScore: number): RetrievalHit[] {
  return rows
    .map((r) => {
      const score = cosineSimilarity(queryVec, r.vector);
      const source =
        r.relPath.startsWith("deal/") ? ("upload" as const) :
        ("kb" as const);
      return {
        text: r.text,
        relPath: r.relPath,
        score,
        source,
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > minScore)
    .slice(0, topK);
}

/** Only `knowledge_base/` documents — used during analysis (uploads are inlined in prompt). */
export async function retrieveFromKnowledgeBase(params: {
  query: string;
  ollamaHost?: string | null;
  topK?: number;
}): Promise<RetrievalHit[]> {
  const { topK: cfgTopK } = cfg();
  const topK = Math.max(1, Math.min(20, params.topK ?? cfgTopK));

  await ensureKnowledgeBaseIndex({ ollamaHost: params.ollamaHost ?? null });

  const rows = await readVectorsFile();
  if (!rows.length) return [];

  const embedder = createLocalEmbedder(params.ollamaHost ?? null);
  const [qv] = await embedder.embedTexts([params.query]);

  return rankRows(rows, qv!, topK, 0.15).map((h) => ({ ...h, source: "kb" as const }));
}

/**
 * Indexes buyer + seller extracted text for a deal under `.rag/deals/<dealId>/`.
 * Called automatically after a successful Analyze so chat can retrieve without touching `knowledge_base/`.
 */
export async function indexDealUploads(opts: {
  dealId: string;
  buyerText: string;
  sellerText: string;
  ollamaHost?: string | null;
}): Promise<void> {
  const { chunkSize, chunkOverlap } = cfg();
  const embedder = createLocalEmbedder(opts.ollamaHost ?? null);

  const rows: Row[] = [];
  const addSide = (side: "buyer" | "seller", raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const chunks = chunkText(text, chunkSize, chunkOverlap);
    for (let i = 0; i < chunks.length; i++) {
      rows.push({
        id: `${opts.dealId}::${side}::${i}`,
        vector: [],
        text: chunks[i]!.text,
        relPath: `deal/${opts.dealId}/${side}#${i}`,
        ext: `.${side}`,
        chunkIndex: i,
      });
    }
  };

  addSide("buyer", opts.buyerText);
  addSide("seller", opts.sellerText);

  if (rows.length === 0) {
    await fs.mkdir(dealsDir(opts.dealId), { recursive: true });
    await writeDealVectorsFile(opts.dealId, []);
    return;
  }

  const batchSize = 16;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const vecs = await embedder.embedTexts(batch.map((r) => r.text));
    for (let j = 0; j < batch.length; j++) {
      batch[j]!.vector = vecs[j]!;
    }
  }

  await writeDealVectorsFile(opts.dealId, rows);
}

/**
 * Retrieval for chat / follow-up: merges `knowledge_base/` + embeddings for this deal's uploads.
 */
export async function retrieveRagMerged(params: {
  query: string;
  dealId?: string | null;
  ollamaHost?: string | null;
  topK?: number;
}): Promise<RetrievalHit[]> {
  const { topK: cfgTopK } = cfg();
  const cap = Math.max(1, Math.min(24, params.topK ?? cfgTopK));
  await ensureKnowledgeBaseIndex({ ollamaHost: params.ollamaHost ?? null });

  const embedder = createLocalEmbedder(params.ollamaHost ?? null);
  const [qv] = await embedder.embedTexts([params.query]);

  const kbRows = await readVectorsFile();
  const dealRows = params.dealId ? await readDealVectorsFile(params.dealId) : [];

  /** Prefer some upload chunks whenever a deal exists, then fill with KB. */
  const dealBudget = dealRows.length ? Math.min(cap, Math.max(4, Math.ceil(cap * 0.45))) : 0;
  const kbBudget = cap - dealBudget;

  const dealHits =
    dealRows.length && dealBudget > 0 ? rankRows(dealRows, qv!, dealBudget, 0.08) : [];
  const seen = new Set(dealHits.map((h) => h.text.slice(0, 200)));

  let kbHits = rankRows(kbRows, qv!, kbBudget, 0.12);
  kbHits = kbHits.filter((h) => !seen.has(h.text.slice(0, 200)));

  const merged = [...dealHits, ...kbHits].sort((a, b) => b.score - a.score).slice(0, cap);
  return merged;
}

export function formatKbContext(hits: RetrievalHit[]): string {
  return formatRagContext(hits);
}

export function formatRagContext(hits: RetrievalHit[]): string {
  if (!hits.length) return "";

  let kbN = 0;
  let upN = 0;
  const blocks = hits.map((h) => {
    if (h.source === "upload") {
      upN++;
      const header = `[UPLOAD ${upN}] ${h.relPath}`;
      return `${header}\n${h.text}`.trim();
    }
    kbN++;
    const header = `[KB ${kbN}] ${h.relPath}`;
    return `${header}\n${h.text}`.trim();
  });

  return `\n--- RETRIEVED CONTEXT (cite [KB #] / [UPLOAD #]) ---\n${blocks.join("\n\n")}\n`;
}

