export type Chunk = {
  id: string;
  text: string;
  start: number;
  end: number;
};

/**
 * Simple whitespace-safe chunker with overlap.
 * - `chunkSize`: target number of characters per chunk.
 * - `overlap`: number of characters to overlap between chunks.
 */
export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): Chunk[] {
  const clean = (text ?? "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const size = Math.max(200, Math.floor(chunkSize));
  const ov = Math.max(0, Math.min(size - 50, Math.floor(overlap)));

  const out: Chunk[] = [];
  let idx = 0;
  let chunkIndex = 0;

  while (idx < clean.length) {
    const targetEnd = Math.min(clean.length, idx + size);
    let end = targetEnd;

    // Try to end on a boundary (newline or sentence-ish) to reduce mid-sentence splits.
    const windowStart = Math.max(idx, targetEnd - 200);
    const window = clean.slice(windowStart, targetEnd);
    const boundary =
      Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf("\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("? "),
        window.lastIndexOf("! ")
      ) ?? -1;
    if (boundary && boundary > 40) {
      end = windowStart + boundary + 1;
    }

    const chunkText = clean.slice(idx, end).trim();
    if (chunkText) {
      out.push({
        id: `chunk_${chunkIndex}`,
        text: chunkText,
        start: idx,
        end,
      });
      chunkIndex++;
    }

    if (end >= clean.length) break;
    idx = Math.max(end - ov, idx + 1);
  }

  return out;
}

