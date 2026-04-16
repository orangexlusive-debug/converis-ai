/**
 * Headers for calling Ollama through tunnels (ngrok free tier returns an HTML
 * interstitial unless this header is set).
 */
export function ollamaTunnelHeaders(originOrUrl: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  try {
    const hostname = new URL(originOrUrl.includes("://") ? originOrUrl : `https://${originOrUrl}`)
      .hostname;
    if (
      hostname.includes("ngrok") ||
      hostname.includes("loca.lt") ||
      hostname.includes("serveo.net")
    ) {
      headers["ngrok-skip-browser-warning"] = "true";
    }
  } catch {
    /* ignore */
  }
  return headers;
}

/** True if the body looks like HTML (proxy/ngrok page, not Ollama JSON). */
export function responseLooksLikeHtml(body: string): boolean {
  const t = body.trimStart();
  return t.startsWith("<") || t.startsWith("\ufeff<");
}

/**
 * Parse Ollama /api/generate JSON body. HTML from proxies/ngrok is an error.
 * If the body is not JSON but not HTML, treat the raw text as the model output (Ollama edge cases).
 */
export function parseOllamaGenerateResponse(rawText: string): {
  ok: true;
  responseText: string;
} | {
  ok: false;
  error: string;
  rawSnippet: string;
} {
  if (!rawText.trim()) {
    return { ok: false, error: "Empty response body.", rawSnippet: "" };
  }
  if (responseLooksLikeHtml(rawText)) {
    return {
      ok: false,
      error:
        "Ollama endpoint returned HTML instead of JSON. This often happens with ngrok without the skip-browser-warning header, a wrong URL, or a proxy error page.",
      rawSnippet: rawText.slice(0, 400),
    };
  }
  try {
    const parsed = JSON.parse(rawText) as { response?: string };
    const responseText =
      typeof parsed.response === "string" ? parsed.response : rawText;
    return { ok: true, responseText };
  } catch {
    return { ok: true, responseText: rawText };
  }
}
