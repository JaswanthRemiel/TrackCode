import 'server-only';
import { NextResponse } from 'next/server';
import { PROVIDERS, ProviderId } from '@/lib/ai/types';
import { ProviderError } from '@/lib/ai/providers';
import { verifyRequest } from './auth';

export interface ParsedProvider {
  provider: ProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Authenticates the caller and validates the BYOK provider config.
 * The key is used for this request only and is never logged or stored.
 */
export async function parseRemielRequest(request: Request, { requireModel = true }: { requireModel?: boolean } = {}): Promise<
  { ok: true; uid: string; body: Record<string, unknown>; provider: ParsedProvider } | { ok: false; response: NextResponse }
> {
  // Token check and body parsing run in parallel.
  const [uid, body] = await Promise.all([
    verifyRequest(request),
    request.json().then(b => (b && typeof b === 'object' ? (b as Record<string, unknown>) : null)).catch(() => null),
  ]);
  if (!uid) return { ok: false, response: jsonError('Please sign in to use Remiel.', 401) };
  if (!body) return { ok: false, response: jsonError('Invalid JSON body', 400) };

  const s = (body.settings ?? {}) as Record<string, unknown>;
  const provider = s.provider as ProviderId;
  if (!provider || !(provider in PROVIDERS)) return { ok: false, response: jsonError('Unknown AI provider', 400) };
  const apiKey = typeof s.apiKey === 'string' ? s.apiKey.trim() : '';
  if (!apiKey || apiKey.length > 512) return { ok: false, response: jsonError('Add your API key in Remiel settings.', 400) };
  const model = typeof s.model === 'string' ? s.model.trim() : '';
  if (requireModel && !model) return { ok: false, response: jsonError('Enter a model name in Remiel settings.', 400) };
  if (model && model.length > 200 || !/^[\w.\-:/@+]+$/.test(model)) return { ok: false, response: jsonError('That model name has characters we do not accept.', 400) };
  const baseUrl = typeof s.baseUrl === 'string' ? s.baseUrl.slice(0, 300) : undefined;

  return { ok: true, uid, body, provider: { provider, model, apiKey, baseUrl } };
}

export function providerErrorResponse(e: unknown) {
  if (e instanceof ProviderError) return jsonError(e.message, e.status);
  if (e instanceof Error && e.name === 'AbortError') return jsonError('Request cancelled', 499);
  if (e instanceof Error && e.name === 'TimeoutError') return jsonError('The AI provider took too long to respond. Try again.', 504);
  const cause = (e as { cause?: unknown })?.cause;
  console.error('Remiel upstream failure:', e instanceof Error ? `${e.name}: ${e.message}` : e, cause ?? '');
  return jsonError('Could not reach the AI provider. Check your network, model name and key.', 502);
}
