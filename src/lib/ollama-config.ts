/** Override with OLLAMA_HOST / OLLAMA_MODEL in `.env.local`. */
const DEFAULT_HOST = "https://ee53-129-222-135-198.ngrok-free.app";
const DEFAULT_MODEL = "qwen2.5:32b";

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
