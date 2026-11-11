'use client';

import { auth } from '@/lib/firebase';
import { ChatMessage, GeneratedPlan, PlanRequest, RemielChatContext, RemielSettings } from './types';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Please sign in to use Remiel.');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function errorFrom(res: Response) {
  try {
    const j = await res.json();
    return new Error(j.error || `Request failed (${res.status})`);
  } catch {
    return new Error(`Request failed (${res.status})`);
  }
}

/** Streams Remiel's reply, calling onDelta with the accumulated text. Resolves with the full reply. */
export async function streamRemielChat(
  settings: RemielSettings,
  messages: ChatMessage[],
  context: RemielChatContext,
  onDelta: (fullText: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch('/api/remiel/chat', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      settings,
      context,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
    signal,
  });
  if (!res.ok || !res.body) throw await errorFrom(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onDelta(text);
  }
  text += decoder.decode();
  onDelta(text);
  return text;
}

export async function generateRemielPlan(
  settings: RemielSettings,
  plan: PlanRequest,
  signal?: AbortSignal,
): Promise<GeneratedPlan & { company: string; perDay: number }> {
  const res = await fetch('/api/remiel/plan', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ settings, plan }),
    signal,
  });
  if (!res.ok) throw await errorFrom(res);
  const j = await res.json();
  return j.plan;
}

/** Asks the provider (through our server) which models this key can use. */
export async function fetchRemielModels(settings: Pick<RemielSettings, 'provider' | 'apiKey' | 'baseUrl'>): Promise<string[]> {
  const res = await fetch('/api/remiel/models', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ settings: { ...settings, model: '' } }),
  });
  if (!res.ok) throw await errorFrom(res);
  const j = await res.json();
  return Array.isArray(j.models) ? j.models : [];
}
