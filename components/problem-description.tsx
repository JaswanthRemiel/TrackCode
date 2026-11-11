'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Lightbulb, Lock } from 'lucide-react';

interface Description {
  paidOnly: boolean;
  html: string | null;
  hints: string[];
}

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: Description };

/** Problem statement fetched from LeetCode via our API (sanitized on the server). */
export function ProblemDescription({ problemId, leetcodeUrl }: { problemId: string; leetcodeUrl: string }) {
  const [state, setState] = useState<{ id: string; value: State } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/problems/${encodeURIComponent(problemId)}/description`, { signal: controller.signal })
      .then(async res => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Could not load the description.');
        setState({ id: problemId, value: { status: 'ready', data: json as Description } });
      })
      .catch(e => {
        if (controller.signal.aborted) return;
        setState({ id: problemId, value: { status: 'error', message: e instanceof Error ? e.message : 'Could not load the description.' } });
      });
    return () => controller.abort();
  }, [problemId]);

  // Results are keyed by problem, so switching problems shows the loader instead of stale text.
  const current: State = state && state.id === problemId ? state.value : { status: 'loading' };

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <FileText className="w-3.5 h-3.5" /> Description
        </h2>
        <a href={leetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          Source: LeetCode <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {current.status === 'loading' && (
        <div className="space-y-2.5 animate-pulse" aria-label="Loading description">
          <div className="h-3 w-11/12 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-3 w-10/12 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-3 w-8/12 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-20 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      )}

      {current.status === 'error' && (
        <p className="text-sm text-zinc-500">
          {current.message}{' '}
          <a href={leetcodeUrl} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">Read it on LeetCode</a>
        </p>
      )}

      {current.status === 'ready' && !current.data.html && (
        <p className="flex items-start gap-2 text-sm text-zinc-500">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {current.data.paidOnly ? 'This is a LeetCode Premium problem, so its statement is not public.' : 'LeetCode did not return a statement for this problem.'}{' '}
            <a href={leetcodeUrl} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">Open on LeetCode</a>
          </span>
        </p>
      )}

      {current.status === 'ready' && current.data.html && (
        <>
          {/* Sanitized server-side with an allowlist (lib/server/leetcode.ts). */}
          <div className="lc-content" dangerouslySetInnerHTML={{ __html: current.data.html }} />
          {current.data.hints.length > 0 && (
            <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-900 pt-3">
              {current.data.hints.map((h, i) => (
                <details key={i} className="group rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 [&::-webkit-details-marker]:hidden">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Hint {i + 1}
                    <span className="ml-auto text-[10px] text-zinc-400 group-open:hidden">Show</span>
                  </summary>
                  <div className="lc-content mt-2 text-[13px]" dangerouslySetInnerHTML={{ __html: h }} />
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
