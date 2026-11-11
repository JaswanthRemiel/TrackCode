import 'server-only';
import { ChatMessage, DEFAULT_COMPATIBLE_BASE_URL, ProviderId } from './types';

export interface CompletionRequest {
  provider: ProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** Ask the provider for a JSON object response where supported. */
  json?: boolean;
  /** Optional JSON schema (Gemini structured output) used with json: true. */
  jsonSchema?: Record<string, unknown>;
  /** Ask reasoning models to think briefly so the first token arrives sooner. Default true. */
  fast?: boolean;
}

export class ProviderError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Calls the selected provider with streaming enabled and returns a stream of plain text deltas.
 * Throws ProviderError (before any bytes are streamed) when the upstream request fails.
 */
export async function streamCompletion(req: CompletionRequest, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const fast = req.fast ?? true;
  try {
    return await dispatch({ ...req, fast }, signal);
  } catch (e) {
    // Some models reject the speed hints (unknown parameter). Retry once without them.
    if (fast && e instanceof ProviderError && e.status === 400 && speedHintsApply(req)) {
      return dispatch({ ...req, fast: false }, signal);
    }
    throw e;
  }
}

function speedHintsApply(req: CompletionRequest) {
  return (req.provider === 'openai' && openAIReasoningEffort(req.model) !== null) || (req.provider === 'gemini' && geminiThinking(req.model) !== null);
}

/** GPT-5 and o-series reason before answering; "low" cuts time to first token a lot. */
function openAIReasoningEffort(model: string): string | null {
  return /^(gpt-5|o\d)/i.test(model) ? 'low' : null;
}

/** Gemini 2.5 and 3 think before answering by default. */
function geminiThinking(model: string): Record<string, unknown> | null {
  const m = model.toLowerCase();
  if (/gemini-3/.test(m)) return { thinkingLevel: 'low' };
  if (/2\.5-flash/.test(m)) return { thinkingBudget: 0 };
  if (/2\.5-pro/.test(m)) return { thinkingBudget: 128 };
  return null;
}

/** fetch() that turns network failures into a readable ProviderError (the real reason hides in e.cause). */
const FIRST_RESPONSE_TIMEOUT_MS = 45_000;
const STREAM_IDLE_TIMEOUT_MS = 90_000;

async function providerFetch(label: string, url: string, init: RequestInit): Promise<Response> {
  // Node would otherwise wait up to 5 minutes for response headers. Give up sooner, with a clear message.
  const timer = new AbortController();
  const timeout = setTimeout(() => timer.abort(), FIRST_RESPONSE_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timer.signal]) : timer.signal;
  try {
    return await fetch(url, { ...init, signal });
  } catch (e) {
    if (timer.signal.aborted && !init.signal?.aborted) {
      throw new ProviderError(`${label} did not start responding within ${FIRST_RESPONSE_TIMEOUT_MS / 1000}s. The model may be overloaded or the model name may be wrong. Try again or pick a faster model.`, 504);
    }
    if (e instanceof Error && (e.name === 'AbortError' || e.name === 'TimeoutError')) throw e;
    const cause = (e as { cause?: { code?: string; message?: string } })?.cause;
    const reason = cause?.code || cause?.message || (e instanceof Error ? e.message : 'network error');
    throw new ProviderError(`Could not reach ${label} (${reason}). Check your connection or the base URL.`, 502);
  } finally {
    clearTimeout(timeout);
  }
}

function dispatch(req: CompletionRequest, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  switch (req.provider) {
    case 'openai':
      return openAIStyle(req, 'https://api.openai.com/v1', signal, true);
    case 'compatible':
      return openAIStyle(req, normalizeBaseUrl(req.baseUrl), signal, false);
    case 'anthropic':
      return anthropic(req, signal);
    case 'gemini':
      return gemini(req, signal);
    default:
      throw new ProviderError('Unsupported provider', 400);
  }
}

/** Collects a full completion as a string (used by the planner). */
export async function completeText(req: CompletionRequest, signal?: AbortSignal): Promise<string> {
  const stream = await streamCompletion(req, signal);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

// ---------------------------------------------------------------------------

function normalizeBaseUrl(raw?: string): string {
  const value = (raw || DEFAULT_COMPATIBLE_BASE_URL).trim().replace(/\/+$/, '');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ProviderError('Invalid base URL', 400);
  }
  if (url.protocol !== 'https:') throw new ProviderError('Base URL must use https', 400);
  const host = url.hostname.toLowerCase();
  // Basic SSRF guard: the server must not be used to reach internal hosts.
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith('[') ||
    host === 'metadata.google.internal'
  ) {
    throw new ProviderError('Base URL host is not allowed', 400);
  }
  return url.toString().replace(/\/+$/, '');
}

async function upstreamError(res: Response, provider: string): Promise<ProviderError> {
  let detail = '';
  try {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      detail = j?.error?.message || j?.message || j?.error || text;
    } catch {
      detail = text;
    }
  } catch {
    /* ignore */
  }
  detail = String(detail).slice(0, 300);
  const status = res.status === 401 || res.status === 403 ? 401 : res.status === 429 ? 429 : res.status === 404 ? 404 : res.status === 400 ? 400 : 502;
  const prefix =
    status === 401 ? `${provider} rejected the API key`
    : status === 404 ? `${provider} could not find that model. Check the model name in Remiel settings`
    : `${provider} error (${res.status})`;
  return new ProviderError(detail ? `${prefix}: ${detail}` : prefix, status);
}

/** Parses an SSE body and emits text produced by `extract` for each `data:` payload. */
function sseToText(body: ReadableStream<Uint8Array>, extract: (data: unknown) => string | null): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  const reader = body.getReader();

  /** Returns true when it enqueued text. */
  const handleLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return false;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') return false;
    try {
      const text = extract(JSON.parse(payload));
      if (text) {
        controller.enqueue(encoder.encode(text));
        return true;
      }
    } catch {
      /* skip malformed chunk */
    }
    return false;
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        await pullOnce(controller);
      } catch (e) {
        reader.cancel(e).catch(() => {});
        throw e;
      }
    },
    cancel(reason) {
      reader.cancel(reason);
    },
  });

  async function pullOnce(controller: ReadableStreamDefaultController<Uint8Array>) {
      // Keep reading until we emit something: a pull that enqueues nothing is never re-invoked.
      for (;;) {
        let idle: ReturnType<typeof setTimeout> | undefined;
        const { done, value } = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => {
            idle = setTimeout(() => reject(new Error(`The provider stopped sending data for ${STREAM_IDLE_TIMEOUT_MS / 1000}s.`)), STREAM_IDLE_TIMEOUT_MS);
          }),
        ]).finally(() => clearTimeout(idle));
        if (done) {
          buffer += decoder.decode();
          if (buffer) handleLine(buffer, controller);
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        let emitted = false;
        for (const line of lines) emitted = handleLine(line, controller) || emitted;
        if (emitted) return;
      }
  }
}

async function openAIStyle(req: CompletionRequest, baseUrl: string, signal: AbortSignal | undefined, official: boolean) {
  const body: Record<string, unknown> = {
    model: req.model,
    stream: true,
    messages: [{ role: 'system', content: req.system }, ...req.messages.map(m => ({ role: m.role, content: m.content }))],
  };
  // Newer OpenAI reasoning models reject max_tokens/temperature; only send the cap to compatible APIs.
  if (!official && req.maxTokens) body.max_tokens = req.maxTokens;
  if (req.json && official) body.response_format = { type: 'json_object' };
  const effort = official && req.fast ? openAIReasoningEffort(req.model) : null;
  if (effort) body.reasoning_effort = effort;

  const res = await providerFetch(official ? 'OpenAI' : 'the provider', `${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${req.apiKey}`,
      ...(official ? {} : { 'X-Title': 'TrackCode Remiel' }),
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw await upstreamError(res, official ? 'OpenAI' : 'Provider');

  return sseToText(res.body, (data) => {
    const d = data as { choices?: { delta?: { content?: string } }[] };
    return d.choices?.[0]?.delta?.content ?? null;
  });
}

async function anthropic(req: CompletionRequest, signal?: AbortSignal) {
  const res = await providerFetch('Anthropic', 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': req.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      system: req.system,
      stream: true,
      messages: req.messages.map(m => ({ role: m.role, content: m.content })),
    }),
    signal,
  });
  if (!res.ok || !res.body) throw await upstreamError(res, 'Anthropic');

  return sseToText(res.body, (data) => {
    const d = data as { type?: string; delta?: { type?: string; text?: string } };
    if (d.type === 'content_block_delta' && d.delta?.type === 'text_delta') return d.delta.text ?? null;
    return null;
  });
}

async function gemini(req: CompletionRequest, signal?: AbortSignal) {
  const model = encodeURIComponent(req.model.replace(/^models\//, ''));
  const generationConfig: Record<string, unknown> = { maxOutputTokens: req.maxTokens ?? 4096 };
  if (req.json) generationConfig.responseMimeType = 'application/json';
  if (req.json && req.jsonSchema) generationConfig.responseSchema = req.jsonSchema;
  const thinking = req.fast ? geminiThinking(req.model) : null;
  if (thinking) generationConfig.thinkingConfig = thinking;

  const res = await providerFetch('Google Gemini', `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': req.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig,
    }),
    signal,
  });
  if (!res.ok || !res.body) throw await upstreamError(res, 'Gemini');

  return sseToText(res.body, (data) => {
    const d = data as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    const parts = d.candidates?.[0]?.content?.parts ?? [];
    return parts.filter(p => !p.thought).map(p => p.text ?? '').join('') || null;
  });
}

// ---------------------------------------------------------------------------
// Model discovery: ask the provider which models this key can use right now.

const NON_CHAT = /(embed|whisper|tts|dall-e|davinci|babbage|moderation|image|audio|realtime|transcri|search|aqa|imagen|veo|computer-use)/i;

export async function listModels(req: { provider: ProviderId; apiKey: string; baseUrl?: string }, signal?: AbortSignal): Promise<string[]> {
  let ids: string[] = [];
  if (req.provider === 'openai' || req.provider === 'compatible') {
    const base = req.provider === 'openai' ? 'https://api.openai.com/v1' : normalizeBaseUrl(req.baseUrl);
    const res = await providerFetch(req.provider === 'openai' ? 'OpenAI' : 'the provider', `${base}/models`, { headers: { Authorization: `Bearer ${req.apiKey}` }, signal });
    if (!res.ok) throw await upstreamError(res, req.provider === 'openai' ? 'OpenAI' : 'Provider');
    const j = (await res.json()) as { data?: { id?: string }[] };
    ids = (j.data ?? []).map(m => m.id ?? '');
    if (req.provider === 'openai') ids = ids.filter(id => !NON_CHAT.test(id));
  } else if (req.provider === 'anthropic') {
    const res = await providerFetch('Anthropic', 'https://api.anthropic.com/v1/models?limit=1000', {
      headers: { 'x-api-key': req.apiKey, 'anthropic-version': '2023-06-01' },
      signal,
    });
    if (!res.ok) throw await upstreamError(res, 'Anthropic');
    const j = (await res.json()) as { data?: { id?: string }[] };
    ids = (j.data ?? []).map(m => m.id ?? '');
  } else if (req.provider === 'gemini') {
    const res = await providerFetch('Google Gemini', 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
      headers: { 'x-goog-api-key': req.apiKey },
      signal,
    });
    if (!res.ok) throw await upstreamError(res, 'Gemini');
    const j = (await res.json()) as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
    ids = (j.models ?? [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => (m.name ?? '').replace(/^models\//, ''))
      .filter(id => !NON_CHAT.test(id));
  } else {
    throw new ProviderError('Unsupported provider', 400);
  }
  return [...new Set(ids.filter(Boolean))].sort((a, b) => a.localeCompare(b)).slice(0, 2000);
}
