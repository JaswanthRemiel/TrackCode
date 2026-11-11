import { NextResponse } from 'next/server';
import { completeText, ProviderError } from '@/lib/ai/providers';
import { buildPlanPrompt } from '@/lib/ai/prompts';
import { GeneratedPlan, PlanDay, PlanRequest } from '@/lib/ai/types';
import { getAllProblems, ServerProblem } from '@/lib/server/problems';
import { jsonError, parseRemielRequest, providerErrorResponse } from '@/lib/server/remiel-request';

export const runtime = 'nodejs';
export const maxDuration = 120;

const ANY = '__any__';

function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function strList(v: unknown, max: number, maxLen = 80): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max).map(s => s.slice(0, maxLen)) : [];
}

/** Picks a candidate pool from our dataset so the model can only choose real problems. */
function buildPool(req: PlanRequest): ServerProblem[] {
  const done = new Set(req.doneIds);
  const revise = new Set(req.revisionIds);
  const focus = new Set(req.focusTopics.map(t => t.toLowerCase()));
  const company = req.company.toLowerCase();

  const scored = getAllProblems()
    .filter(p => !done.has(p.id))
    .filter(p => req.company === ANY || p.company.some(c => c.toLowerCase() === company))
    .map(p => {
      let score = Math.min(p.company.length, 40); // frequency across companies ≈ popularity
      if (focus.size && p.tags.some(t => focus.has(t.toLowerCase()))) score += 50;
      if (revise.has(p.id)) score += 25;
      if (req.difficulty === 'hard-focus' && p.difficulty !== 'EASY') score += 15;
      if (req.difficulty === 'easy-first' && p.difficulty !== 'HARD') score += 10;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);

  const want = Math.min(220, Math.max(req.days * req.perDay * 2, 40));
  return scored.slice(0, want).map(x => x.p);
}

/** House style: no em dashes in anything we display. */
function clean(text: string) {
  return text.replace(/\s*\u2014\s*/g, ', ');
}

/** Removes line and block comments and trailing commas, leaving string contents alone. */
function stripJsonNoise(src: string): string {
  let out = '';
  let inStr = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      out += c;
      if (c === '\\') out += src[++i] ?? '';
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}

/** Closes strings, arrays and objects left open when the output was cut off. */
function closeTruncated(src: string): string {
  const stack: string[] = [];
  let inStr = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }
  let out = src + (inStr ? '"' : '');
  out = out.replace(/,\s*$/, '').replace(/:\s*$/, ': null');
  return out + stack.reverse().join('');
}

/** Lenient JSON extraction for model output. Returns null when nothing usable is found. */
function extractJson(text: string): unknown | null {
  const cleaned = stripJsonNoise(text.replace(/```(?:json)?/gi, ''));
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  const end = cleaned.lastIndexOf('}');
  const attempts = [end > start ? cleaned.slice(start, end + 1) : null, closeTruncated(cleaned.slice(start).trim())];
  for (const candidate of attempts) {
    if (!candidate) continue;
    try {
      const v = JSON.parse(candidate.replace(/,(\s*[}\]])/g, '$1'));
      if (v && typeof v === 'object') return v;
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Deterministic plan from the same pool, grouped by topic, used when the model output is unusable. */
function fallbackPlan(req: PlanRequest, pool: ServerProblem[], companyLabel: string): GeneratedPlan {
  const rank = { EASY: 0, MEDIUM: 1, HARD: 2 } as const;
  const sorted = [...pool].sort((a, b) =>
    (a.tags[0] ?? '').localeCompare(b.tags[0] ?? '') || (req.difficulty === 'hard-focus' ? rank[b.difficulty] - rank[a.difficulty] : rank[a.difficulty] - rank[b.difficulty]),
  );
  const days: PlanDay[] = [];
  for (let i = 0; i < req.days && sorted.length; i++) {
    const chunk = sorted.splice(0, req.perDay);
    const counts = new Map<string, number>();
    chunk.forEach(p => p.tags.slice(0, 2).forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)));
    const theme = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? `Day ${i + 1}`;
    days.push({ day: i + 1, theme, tip: '', problemIds: chunk.map(p => p.id) });
  }
  return {
    title: `${companyLabel === 'General interview prep (any company)' ? 'General' : companyLabel} ${req.days}-day plan`,
    summary: 'Problems are grouped by topic, using unsolved problems from your target list. The AI reply could not be read, so this plan was arranged automatically.',
    days,
  };
}

const PLAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    summary: { type: 'STRING' },
    days: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          day: { type: 'INTEGER' },
          theme: { type: 'STRING' },
          tip: { type: 'STRING' },
          problemIds: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['day', 'theme', 'problemIds'],
      },
    },
  },
  required: ['title', 'summary', 'days'],
};

/** Validates model output strictly against the candidate pool. */
function validatePlan(raw: unknown, req: PlanRequest, pool: ServerProblem[]): GeneratedPlan {
  const allowed = new Set(pool.map(p => p.id));
  const used = new Set<string>();
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawDays = Array.isArray(r.days) ? r.days : [];

  const days: PlanDay[] = [];
  for (let i = 0; i < req.days; i++) {
    const d = (rawDays[i] ?? {}) as Record<string, unknown>;
    const ids = strList(d.problemIds, req.perDay + 2, 200).filter(id => allowed.has(id) && !used.has(id)).slice(0, req.perDay);
    ids.forEach(id => used.add(id));
    days.push({
      day: i + 1,
      theme: typeof d.theme === 'string' ? clean(d.theme).slice(0, 80) : `Day ${i + 1}`,
      tip: typeof d.tip === 'string' ? clean(d.tip).slice(0, 240) : '',
      problemIds: ids,
    });
  }

  // Top up any short days from unused pool items so the plan is always complete.
  const leftovers = pool.filter(p => !used.has(p.id));
  for (const day of days) {
    while (day.problemIds.length < req.perDay && leftovers.length) {
      const next = leftovers.shift()!;
      day.problemIds.push(next.id);
      used.add(next.id);
    }
  }

  return {
    title: typeof r.title === 'string' && r.title.trim() ? clean(r.title).slice(0, 100) : 'Remiel study plan',
    summary: typeof r.summary === 'string' ? clean(r.summary).slice(0, 600) : '',
    days: days.filter(d => d.problemIds.length > 0),
  };
}

export async function POST(request: Request) {
  const parsed = await parseRemielRequest(request);
  if (!parsed.ok) return parsed.response;
  const { body, provider } = parsed;

  const p = (body.plan ?? {}) as Record<string, unknown>;
  const req: PlanRequest = {
    company: typeof p.company === 'string' && p.company.trim() ? p.company.slice(0, 80) : ANY,
    days: clampInt(p.days, 1, 60, 14),
    perDay: clampInt(p.perDay, 1, 8, 3),
    difficulty: p.difficulty === 'easy-first' || p.difficulty === 'hard-focus' ? p.difficulty : 'balanced',
    focusTopics: strList(p.focusTopics, 12),
    goal: typeof p.goal === 'string' ? p.goal.slice(0, 400) : undefined,
    doneIds: strList(p.doneIds, 5000, 200),
    revisionIds: strList(p.revisionIds, 2000, 200),
  };

  const pool = buildPool(req);
  if (!pool.length) return jsonError('No unsolved problems match that company/topic selection.', 404);

  const companyLabel = req.company === ANY ? 'General interview prep (any company)' : req.company;
  const { system, user } = buildPlanPrompt(req, pool, companyLabel);

  try {
    const base = { ...provider, system, maxTokens: 8192, json: true } as const;
    const ask = async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
      try {
        return await completeText({ ...base, messages, jsonSchema: PLAN_SCHEMA }, request.signal);
      } catch (e) {
        // A model that rejects structured output still gets plain JSON mode.
        if (e instanceof ProviderError && e.status === 400) return completeText({ ...base, messages }, request.signal);
        throw e;
      }
    };

    const first = await ask([{ role: 'user', content: user }]);
    let raw = extractJson(first);
    let replyText = first;

    if (!raw) {
      console.warn('Remiel plan: unreadable model output, retrying. First 400 chars:', first.slice(0, 400));
      replyText = await ask([
        { role: 'user', content: user },
        { role: 'assistant', content: first.slice(0, 4000) || '(empty)' },
        { role: 'user', content: 'That was not valid JSON. Reply again with ONLY the JSON object in the exact shape described, no comments and no other text.' },
      ]);
      raw = extractJson(replyText);
    }

    let plan = raw ? validatePlan(raw, req, pool) : null;
    if (!plan || !plan.days.length) {
      console.warn('Remiel plan: falling back to automatic plan. Model output started with:', replyText.slice(0, 400));
      plan = fallbackPlan(req, pool, companyLabel);
    }
    return NextResponse.json({ plan: { ...plan, company: req.company === ANY ? 'Any company' : req.company, perDay: req.perDay } });
  } catch (e) {
    return providerErrorResponse(e);
  }
}
