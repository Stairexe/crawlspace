export type ProviderName = "anthropic" | "openai";

export interface ProviderCall {
  system: string;
  user: string;
  maxTokens?: number;
}

export interface ProviderResult {
  text: string;
  model: string;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 502,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

const MODELS: Record<ProviderName, string> = {
  anthropic: "claude-sonnet-4-5",
  openai: "gpt-4.1-mini",
};

/** Which providers this deployment can serve without the user supplying a key. */
export function serverProviders(): ProviderName[] {
  const out: ProviderName[] = [];
  if (process.env.ANTHROPIC_API_KEY) out.push("anthropic");
  if (process.env.OPENAI_API_KEY) out.push("openai");
  return out;
}

export function defaultProvider(): ProviderName | null {
  const preferred = process.env.CRAWLSPACE_DEFAULT_PROVIDER as ProviderName | undefined;
  const available = serverProviders();
  if (preferred && available.includes(preferred)) return preferred;
  return available[0] ?? null;
}

function keyFor(provider: ProviderName, supplied?: string): string {
  if (supplied && supplied.trim()) return supplied.trim();
  const env = provider === "anthropic" ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
  if (!env) {
    throw new ProviderError(
      `No API key configured for ${provider}. Paste your own key to use the rewrite layer.`,
      "NO_API_KEY",
      400,
    );
  }
  return env;
}

async function callAnthropic(call: ProviderCall, apiKey: string): Promise<ProviderResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELS.anthropic,
      max_tokens: call.maxTokens ?? 1200,
      system: call.system,
      messages: [{ role: "user", content: call.user }],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderError(
      res.status === 401
        ? "That Anthropic API key was rejected."
        : `Anthropic returned ${res.status}. ${body.slice(0, 160)}`,
      res.status === 401 ? "BAD_KEY" : "PROVIDER_ERROR",
      res.status === 401 ? 400 : 502,
    );
  }

  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (json.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("");
  return { text, model: MODELS.anthropic };
}

async function callOpenAI(call: ProviderCall, apiKey: string): Promise<ProviderResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODELS.openai,
      max_tokens: call.maxTokens ?? 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: call.system },
        { role: "user", content: call.user },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderError(
      res.status === 401
        ? "That OpenAI API key was rejected."
        : `OpenAI returned ${res.status}. ${body.slice(0, 160)}`,
      res.status === 401 ? "BAD_KEY" : "PROVIDER_ERROR",
      res.status === 401 ? 400 : 502,
    );
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { text: json.choices?.[0]?.message?.content ?? "", model: MODELS.openai };
}

export async function callProvider(
  provider: ProviderName,
  call: ProviderCall,
  suppliedKey?: string,
): Promise<ProviderResult> {
  const key = keyFor(provider, suppliedKey);
  try {
    return provider === "anthropic"
      ? await callAnthropic(call, key)
      : await callOpenAI(call, key);
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new ProviderError("The model took too long to respond.", "PROVIDER_TIMEOUT");
    }
    throw new ProviderError("Could not reach the model provider.", "PROVIDER_UNREACHABLE");
  }
}

/** Models sometimes wrap JSON in prose or a code fence. Get the object out regardless. */
export function parseJsonResponse<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new ProviderError("The model did not return usable JSON.", "BAD_MODEL_OUTPUT");
  }
}
