export const AI_MODEL = "llama-3.1-8b-instant";
export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MAX_RETRIES = 4;
const BASE_RETRY_MS = 1500;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip markdown fences and extract the first JSON object/array from AI output. */
export function stripMarkdownJson(rawText: string): string {
  let cleanJson = (rawText || "{}").trim();
  cleanJson = cleanJson
    .replace(/^```(?:json)?\s*/gi, "")
    .replace(/\s*```\s*$/g, "")
    .replace(/^`+|`+$/g, "")
    .trim();
  const match = cleanJson.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) cleanJson = match[0];
  return cleanJson;
}

export function getAiMessageContent(response: {
  choices?: Array<{ message?: { content?: string } }>;
}): string {
  return response.choices?.[0]?.message?.content || "{}";
}

export function parseAiJson<T>(rawText: string, fallback?: T): T {
  const cleanJson = stripMarkdownJson(rawText);
  try {
    return JSON.parse(cleanJson) as T;
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error("Failed to parse AI JSON response");
  }
}

async function groqFetch(body: Record<string, unknown>): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");
      const waitMs = retryAfterHeader
        ? Math.max(parseInt(retryAfterHeader, 10) * 1000, BASE_RETRY_MS)
        : BASE_RETRY_MS * (attempt + 1);
      console.warn(`[Groq] Rate limited (429). Retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await delay(waitMs);
      lastError = new Error(`Groq API rate limited (429)`);
      continue;
    }

    if (!response.ok) {
      let errText = "";
      try {
        errText = await response.text();
      } catch {
        /* ignore */
      }
      throw new Error(`Groq API Error ${response.status}: ${errText}`);
    }

    return response;
  }

  throw lastError ?? new Error("Groq API rate limited after retries");
}

export async function fetchGroq(
  messages: Array<{ role: string; content: string }>,
  jsonFormat = false
): Promise<{
  choices?: Array<{ message?: { content?: string } }>;
}> {
  const body: Record<string, unknown> = { model: AI_MODEL, messages, stream: false };
  if (jsonFormat) body.response_format = { type: "json_object" };
  const response = await groqFetch(body);
  return response.json() as Promise<{
    choices?: Array<{ message?: { content?: string } }>;
  }>;
}

export async function fetchGroqStream(
  messages: Array<{ role: string; content: string }>
): Promise<ReadableStream<Uint8Array>> {
  const response = await groqFetch({ model: AI_MODEL, messages, stream: true });
  const body = response.body;
  if (!body) throw new Error("Groq stream body is empty");
  return body;
}

export async function* readGroqStreamChunks(
  streamBody: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = streamBody.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split("\n");
      for (const line of lines) {
        if (!line.trim().startsWith("data: ")) continue;
        const dataStr = line.replace("data: ", "").trim();
        if (dataStr === "[DONE]") return;
        try {
          const chunk = JSON.parse(dataStr) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const text = chunk.choices?.[0]?.delta?.content || "";
          if (text) yield text;
        } catch {
          /* skip malformed SSE chunks */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
