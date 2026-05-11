import { NextResponse } from "next/server";
import { CONVERIS_CHAT_SYSTEM_BASE } from "@/lib/converis-persona";
import { normalizeOllamaHost, normalizeOllamaModel } from "@/lib/ollama-config";
import { ollamaTunnelHeaders, responseLooksLikeHtml } from "@/lib/ollama-http";
import { formatKbContext, retrieveRagMerged } from "@/lib/rag/store";

export const runtime = "nodejs";
export const maxDuration = 120;

type ChatBody = {
  messages?: { role: string; content: string }[];
  ollamaHost?: string;
  ollamaModel?: string;
  dealContext?: string;
  dealId?: string;
};

export async function POST(req: Request) {
  try {
    return await handleChatPost(req);
  } catch (e) {
    console.error("[api/chat]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Internal error while chatting. Check server logs.",
      },
      { status: 500 }
    );
  }
}

async function handleChatPost(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );

  if (messages.length === 0) {
    return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
  }

  const ollamaHost = normalizeOllamaHost(body.ollamaHost);
  const ollamaModel = normalizeOllamaModel(body.ollamaModel);

  const dealBlock = body.dealContext?.trim();
  const dealIdRaw = typeof body.dealId === "string" ? body.dealId.trim() : "";
  const dealIdForRag =
    /^[a-zA-Z0-9_-]{8,128}$/.test(dealIdRaw) ? dealIdRaw : undefined;

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  let kbContext = "";
  try {
    const hits = await retrieveRagMerged({
      query: `${lastUser}\n\n${dealBlock ?? ""}`.slice(0, 4000),
      dealId: dealIdForRag,
      ollamaHost,
    });
    kbContext = formatKbContext(hits);
  } catch (e) {
    console.warn("[rag] KB retrieval failed:", e);
    kbContext = "";
  }

  const system = `${CONVERIS_CHAT_SYSTEM_BASE}

GROUNDING + EXPERT GUIDANCE RULE:
- You may provide expert-level M&A / PMI guidance and structured recommendations.
- Do not invent deal-specific facts (numbers, dates, commitments, policies, systems) unless they appear in DEAL CONTEXT, KNOWLEDGE BASE excerpts, or the user's messages.
- If you make assumptions, label them clearly as assumptions and explain what document would confirm them.
- When you use retrieved excerpts, cite uploads with [UPLOAD #] and global knowledge base snippets with [KB #]. If you rely on general expertise without retrieved excerpt support, do not cite those tags.

${dealBlock ? `\n--- DEAL CONTEXT (prioritize for deal-specific facts) ---\n${dealBlock}\n` : ""}${kbContext}`;
  const ollamaMessages = [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const url = `${ollamaHost}/api/chat`;
  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(url, {
      method: "POST",
      headers: ollamaTunnelHeaders(ollamaHost),
      body: JSON.stringify({
        model: ollamaModel,
        messages: ollamaMessages,
        stream: false,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json(
      { error: `Could not reach the inference server at ${ollamaHost}. ${msg}` },
      { status: 502 }
    );
  }

  const rawText = await ollamaRes.text();
  if (!ollamaRes.ok) {
    if (responseLooksLikeHtml(rawText)) {
      return NextResponse.json(
        {
          error: `The inference server returned HTTP ${ollamaRes.status} with an HTML page instead of JSON.`,
          hint: "Check the base URL, tunnel, and that the inference service is running.",
          rawSnippet: rawText.slice(0, 400),
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: `Inference server error (${ollamaRes.status}): ${rawText || ollamaRes.statusText}` },
      { status: 502 }
    );
  }

  if (responseLooksLikeHtml(rawText)) {
    return NextResponse.json(
      {
        error:
          "The chat endpoint returned HTML instead of JSON (often a tunnel browser warning or wrong URL). Check headers and base URL.",
        rawSnippet: rawText.slice(0, 400),
      },
      { status: 502 }
    );
  }

  let assistant = "";
  try {
    const parsed = JSON.parse(rawText) as {
      message?: { content?: string };
    };
    assistant =
      typeof parsed.message?.content === "string" ? parsed.message.content : "";
  } catch {
    assistant = "";
  }

  if (!assistant.trim()) {
    return NextResponse.json(
      {
        error: "The inference server returned an empty response.",
        rawResponse: rawText,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: assistant,
    model: ollamaModel,
  });
}
