import { extractPdfText } from "@/lib/pdf-extract";

const MAX_TEXT_CHARS = 120_000;

function extension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export type DocumentExtractResult =
  | { ok: true; text: string; truncated: boolean }
  | { ok: false; error: string };

/**
 * Extract readable text from PDFs or plain-text documents (UTF-8).
 */
export async function extractDocumentText(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<DocumentExtractResult> {
  const ext = extension(fileName);
  const type = (mimeType || "").toLowerCase();

  if (type === "application/pdf" || ext === ".pdf") {
    try {
      const r = await extractPdfText(buffer);
      return { ok: true, text: r.text, truncated: r.truncated };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "PDF parse failed";
      return { ok: false, error: `${fileName}: ${msg}` };
    }
  }

  const textExtensions = new Set([
    ".txt",
    ".md",
    ".markdown",
    ".csv",
    ".json",
    ".log",
    ".tsv",
    ".rtf",
  ]);
  const isPlain =
    type.startsWith("text/") ||
    type === "application/json" ||
    type === "application/xml" ||
    type === "text/xml" ||
    textExtensions.has(ext);

  if (isPlain) {
    try {
      let raw = buffer.toString("utf8").replace(/\u0000/g, "").trim();
      const truncated = raw.length > MAX_TEXT_CHARS;
      if (truncated) raw = raw.slice(0, MAX_TEXT_CHARS);
      return { ok: true, text: raw, truncated };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not read file as UTF-8 text";
      return { ok: false, error: `${fileName}: ${msg}` };
    }
  }

  return {
    ok: false,
    error: `${fileName}: unsupported type (use PDF or plain text: .txt, .md, .csv, .json, etc.).`,
  };
}

/** `accept` string for `<input type="file">` */
export const DOCUMENT_ACCEPT =
  ".pdf,.txt,.md,.markdown,.csv,.json,.log,.tsv,.xml,.rtf,application/pdf,text/plain,text/markdown,text/csv,text/xml,application/json,application/xml";
