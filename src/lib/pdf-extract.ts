import { PDFParse } from "pdf-parse";

const MAX_CHARS = 120_000;

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  truncated: boolean;
  pageCount: number;
}> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const full = (result.text || "").replace(/\u0000/g, "").trim();
    const truncated = full.length > MAX_CHARS;
    const text = truncated ? full.slice(0, MAX_CHARS) : full;
    return { text, truncated, pageCount: result.total };
  } finally {
    await parser.destroy();
  }
}
