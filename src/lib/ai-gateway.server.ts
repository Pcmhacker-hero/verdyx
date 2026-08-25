// Server-only helper to call LLM providers (Gemini, OpenAI, or compatible gateways).
// Never import this in client code.

export type UserContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export interface AICallOptions {
  system: string;
  user: string | UserContentPart[];
  json?: boolean;
  model?: string;
  temperature?: number;
}

export async function callAI(opts: AICallOptions): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;

  let endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  let apiKey = geminiKey;
  let defaultModel = "gemini-2.0-flash";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (geminiKey) {
    endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    apiKey = geminiKey;
    defaultModel = "gemini-2.0-flash";
    headers["Authorization"] = `Bearer ${geminiKey}`;
  } else if (openaiKey) {
    endpoint = "https://api.openai.com/v1/chat/completions";
    apiKey = openaiKey;
    defaultModel = "gpt-4o-mini";
    headers["Authorization"] = `Bearer ${openaiKey}`;
  } else if (lovableKey) {
    endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    apiKey = lovableKey;
    defaultModel = "google/gemini-2.5-flash";
    headers["Lovable-API-Key"] = lovableKey;
    headers["X-Lovable-AIG-SDK"] = "raw-fetch";
  } else {
    throw new Error(
      "No AI API key configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your .env file.",
    );
  }

  const model = opts.model ?? defaultModel;

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: opts.temperature ?? 0.4,
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached — please retry in a moment.");
    if (res.status === 401 || res.status === 403) {
      throw new Error(`AI authentication failed [${res.status}]. Please check your API key.`);
    }
    throw new Error(`AI API error [${res.status}]: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response");
  return content;
}

// Backward compatibility alias for existing server function calls
export const callLovableAI = callAI;

export function tryParseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try to extract JSON from a code fence
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
