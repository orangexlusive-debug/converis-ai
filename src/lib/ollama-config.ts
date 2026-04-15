const DEFAULT_HOST = "http://localhost:11434";
/** Strong default; must exist locally (`ollama pull …`). */
const DEFAULT_MODEL = "llama3.1:8b";

export function normalizeOllamaHost(input: string | null | undefined): string {
  const raw = (input ?? process.env.OLLAMA_HOST ?? DEFAULT_HOST).trim();
  try {
    const u = new URL(raw.includes("://") ? raw : `http://${raw}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return DEFAULT_HOST;
    }
    return u.origin;
  } catch {
    return DEFAULT_HOST;
  }
}

export function normalizeOllamaModel(input: string | null | undefined): string {
  const m = (input ?? process.env.OLLAMA_MODEL ?? DEFAULT_MODEL).trim();
  return m.length ? m : DEFAULT_MODEL;
}
