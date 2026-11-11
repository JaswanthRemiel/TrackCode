import 'server-only';
import sanitizeHtml from 'sanitize-html';
import { getProblem } from './problems';

export interface ProblemDescription {
  /** True for LeetCode Premium problems, whose statement is not public. */
  paidOnly: boolean;
  /** Sanitized HTML, safe to render. Null when unavailable. */
  html: string | null;
  /** Plain-text statement for Remiel's context. */
  text: string | null;
  /** Sanitized HTML hints. */
  hints: string[];
}

const DAY = 60 * 60 * 24;
const cache = new Map<string, { at: number; value: ProblemDescription }>();

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'code', 'pre', 'ul', 'ol', 'li', 'sup', 'sub', 'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote'],
  allowedAttributes: { img: ['src', 'alt', 'width', 'height'] },
  // Only LeetCode's own image hosts; everything else is dropped.
  allowedSchemes: ['https'],
  exclusiveFilter: frame => frame.tag === 'img' && !/^https:\/\/(assets\.leetcode\.com|leetcode\.com)\//.test(frame.attribs.src || ''),
  transformTags: {
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, alt: attribs.alt || 'Problem illustration', loading: 'lazy' } as Record<string, string> }),
    font: 'span',
  },
};

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function toText(html: string) {
  const withBreaks = html.replace(/<\/(p|li|pre|div)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<sup>/gi, '^');
  return decodeEntities(sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} }))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slugFor(problemId: string): string | null {
  const p = getProblem(problemId);
  if (!p) return null;
  const m = p.leetcodeUrl.match(/leetcode\.com\/problems\/([^/?#]+)/);
  return m ? m[1] : p.id;
}

/**
 * Fetches a problem statement from LeetCode's public GraphQL endpoint.
 * Only ids from our own dataset are looked up. Results are cached for a day.
 */
export async function getProblemDescription(problemId: string, timeoutMs = 6000): Promise<ProblemDescription | null> {
  const slug = slugFor(problemId);
  if (!slug) return null;

  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < DAY * 1000) return hit.value;

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: `https://leetcode.com/problems/${slug}/`,
      'User-Agent': 'Mozilla/5.0 (compatible; TrackCode/1.0)',
    },
    body: JSON.stringify({
      query: 'query q($titleSlug: String!) { question(titleSlug: $titleSlug) { isPaidOnly content hints } }',
      variables: { titleSlug: slug },
    }),
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: DAY },
  });
  if (!res.ok) throw new Error(`LeetCode responded ${res.status}`);

  const json = await res.json();
  const q = json?.data?.question;
  if (!q) return null;

  const raw: string | null = typeof q.content === 'string' && q.content.trim() ? q.content : null;
  const value: ProblemDescription = {
    paidOnly: Boolean(q.isPaidOnly),
    html: raw ? sanitizeHtml(raw, SANITIZE) : null,
    text: raw ? toText(raw) : null,
    hints: Array.isArray(q.hints) ? q.hints.filter((h: unknown): h is string => typeof h === 'string').map((h: string) => sanitizeHtml(h, SANITIZE)) : [],
  };

  if (cache.size > 2000) cache.clear();
  cache.set(slug, { at: Date.now(), value });
  return value;
}
