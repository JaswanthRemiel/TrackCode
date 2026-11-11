import { streamCompletion } from '@/lib/ai/providers';
import { buildChatSystemPrompt, sanitizeMessages } from '@/lib/ai/prompts';
import { RemielChatContext } from '@/lib/ai/types';
import { getProblem, hasProblem } from '@/lib/server/problems';
import { getProblemDescription } from '@/lib/server/leetcode';
import { jsonError, parseRemielRequest, providerErrorResponse } from '@/lib/server/remiel-request';

export const runtime = 'nodejs';
export const maxDuration = 60;

const STATEMENT_WAIT_MS = 1200;

export async function POST(request: Request) {
  // Start the LeetCode statement fetch right away, in parallel with auth and parsing.
  // It only ever looks up ids from our own dataset, and results are cached.
  const statementPromise: Promise<string | null> = request
    .clone()
    .json()
    .then(b => {
      const id = b?.context?.problemId;
      return typeof id === 'string' && hasProblem(id) ? getProblemDescription(id, 4000).then(d => d?.text ?? null) : null;
    })
    .catch(() => null);

  const parsed = await parseRemielRequest(request);
  if (!parsed.ok) return parsed.response;
  const { body, provider } = parsed;

  const messages = sanitizeMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return jsonError('Send a message to Remiel.', 400);
  }

  const ctx = (body.context ?? {}) as RemielChatContext;
  // Problem details come from our own dataset, never from the client.
  const problem = getProblem(typeof ctx.problemId === 'string' ? ctx.problemId : null);
  if (ctx.problemId && !problem) return jsonError('Unknown problem', 404);

  // Use the statement if it is ready within a short wait; otherwise answer without it.
  // The fetch keeps running and fills the cache for the next message.
  const statement = problem
    ? await Promise.race([statementPromise, new Promise<null>(r => setTimeout(() => r(null), STATEMENT_WAIT_MS))])
    : null;

  try {
    const stream = await streamCompletion(
      {
        ...provider,
        system: buildChatSystemPrompt(problem, ctx, statement),
        messages,
        maxTokens: 4096,
      },
      request.signal,
    );
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
    });
  } catch (e) {
    return providerErrorResponse(e);
  }
}
