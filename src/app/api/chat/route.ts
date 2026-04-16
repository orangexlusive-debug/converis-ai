import { NextResponse } from "next/server";
import { normalizeOllamaHost, normalizeOllamaModel } from "@/lib/ollama-config";
import { ollamaTunnelHeaders, responseLooksLikeHtml } from "@/lib/ollama-http";

export const runtime = "nodejs";
export const maxDuration = 120;

type ChatBody = {
  messages?: { role: string; content: string }[];
  ollamaHost?: string;
  ollamaModel?: string;
  dealContext?: string;
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

  const system =
    body.dealContext?.trim() ||
    "You are Converis AI, a concise PMI assistant. Answer only from the user’s context and documents they have shared. If uncertain, say so.";
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
      { error: `Could not reach Ollama at ${ollamaHost}. ${msg}` },
      { status: 502 }
    );
  }

  const rawText = await ollamaRes.text();
  if (!ollamaRes.ok) {
    if (responseLooksLikeHtml(rawText)) {
      return NextResponse.json(
        {
          error: `Ollama returned HTTP ${ollamaRes.status} with an HTML page instead of JSON.`,
          hint: "Check the Ollama URL and ngrok tunnel.",
          rawSnippet: rawText.slice(0, 400),
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: `Ollama error (${ollamaRes.status}): ${rawText || ollamaRes.statusText}` },
      { status: 502 }
    );
  }

  if (responseLooksLikeHtml(rawText)) {
    return NextResponse.json(
      {
        error:
          "Ollama /api/chat returned HTML instead of JSON (often ngrok interstitial). Check tunnel headers and URL.",
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
        error: "Ollama returned an empty response.",
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
