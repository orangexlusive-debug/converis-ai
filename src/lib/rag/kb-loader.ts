import fs from "node:fs/promises";
import path from "node:path";
import * as pdfParse from "pdf-parse";

export type KnowledgeDoc = {
  path: string;
  relPath: string;
  ext: string;
  mtimeMs: number;
  size: number;
  text: string;
};

const SUPPORTED = new Set([".pdf", ".txt", ".md"]);

async function statSafe(p: string) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await listFilesRecursive(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function readPdfText(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  const parsed = await (pdfParse as unknown as (b: Buffer) => Promise<{ text?: string }>)(buf);
  return (parsed.text ?? "").trim();
}

async function readTextFile(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  // best-effort utf8
  return buf.toString("utf8").trim();
}

export async function loadKnowledgeBaseDocuments(params?: {
  baseDir?: string;
}): Promise<KnowledgeDoc[]> {
  const baseDir = params?.baseDir ?? path.join(process.cwd(), "knowledge_base");
  const st = await statSafe(baseDir);
  if (!st || !st.isDirectory()) return [];

  const files = await listFilesRecursive(baseDir);
  const docs: KnowledgeDoc[] = [];

  for (const p of files) {
    const ext = path.extname(p).toLowerCase();
    if (!SUPPORTED.has(ext)) continue;

    const stat = await fs.stat(p);
    let text = "";
    try {
      if (ext === ".pdf") text = await readPdfText(p);
      else text = await readTextFile(p);
    } catch {
      text = "";
    }
    if (!text.trim()) continue;

    docs.push({
      path: p,
      relPath: path.relative(baseDir, p),
      ext,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      text,
    });
  }

  return docs;
}

