'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { useUserNotes } from '@/hooks/useUserNotes';
import { RemielChat } from '@/components/remiel/RemielChat';
import { ProblemDescription } from '@/components/problem-description';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { updateProblemStatus } from '@/lib/progress';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ProgressStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowLeft, Building2, CheckCircle2, ExternalLink, RotateCcw, Circle, StickyNote } from 'lucide-react';

const DIFF_STYLES = {
  EASY: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
  MEDIUM: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
  HARD: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
} as const;

const STATUS_OPTIONS: { value: ProgressStatus; label: string; icon: typeof Circle; active: string }[] = [
  { value: 'todo', label: 'Todo', icon: Circle, active: 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 border-transparent' },
  { value: 'done', label: 'Done', icon: CheckCircle2, active: 'bg-emerald-500 text-white border-transparent' },
  { value: 'revision', label: 'Revise', icon: RotateCcw, active: 'bg-amber-500 text-white border-transparent' },
];

export default function ProblemDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { userData } = useAuth();
  const { problems, userProgress, loading } = useData();
  const { notes } = useUserNotes(userData?.uid);

  const problem = useMemo(() => problems.find(p => p.id === id), [problems, id]);
  const status: ProgressStatus = userProgress[id]?.status || 'todo';
  const savedNote = notes[id] ?? '';

  const [note, setNote] = useState('');
  const [noteDirty, setNoteDirty] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!noteDirty) setNote(savedNote);
  }, [savedNote, noteDirty]);

  const companies = useMemo(() => (problem ? ((Array.isArray(problem.company) ? problem.company : [problem.company]) as string[]) : []), [problem]);

  const related = useMemo(() => {
    if (!problem) return [];
    const tags = new Set(problem.tags);
    return problems
      .filter(p => p.id !== problem.id)
      .map(p => ({ p, score: p.tags.filter(t => tags.has(t)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(x => x.p);
  }, [problems, problem]);

  const progressSummary = useMemo(() => {
    const vals = Object.values(userProgress);
    return { solved: vals.filter(v => v.status === 'done').length, revision: vals.filter(v => v.status === 'revision').length, total: problems.length };
  }, [userProgress, problems.length]);

  const getContext = useCallback(
    () => ({ problemId: id, status, note: savedNote, progress: progressSummary }),
    [id, status, savedNote, progressSummary],
  );

  const setStatus = async (s: ProgressStatus) => {
    if (!userData || s === status) return;
    setUpdating(true);
    try {
      await updateProblemStatus(userData, userProgress, id, s);
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setUpdating(false);
    }
  };

  const saveNote = async () => {
    if (!userData) return;
    setSavingNote(true);
    try {
      await setDoc(doc(db, 'notes', `${userData.uid}_${id}`), { userId: userData.uid, problemId: id, content: note });
      setNoteDirty(false);
    } catch (e) {
      console.error('Failed to save note', e);
    } finally {
      setSavingNote(false);
    }
  };

  if (!userData) return null;

  if (!problem) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <p className="text-sm text-zinc-500">{loading || problems.length === 0 ? 'Loading problem…' : 'Problem not found.'}</p>
        <Link href="/problems" className="text-xs font-semibold text-accent hover:underline">← Back to problems</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left: problem */}
      <div className="space-y-6 min-w-0">
        <Link href="/problems" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          <ArrowLeft className="w-3.5 h-3.5" /> Problems
        </Link>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border', DIFF_STYLES[problem.difficulty])}>
              {problem.difficulty}
            </span>
            {problem.tags.map(t => (
              <span key={t} className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded bg-zinc-50/50 dark:bg-zinc-900/20">
                {t}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance">{problem.title}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-white dark:bg-zinc-950">
              {STATUS_OPTIONS.map(o => (
                <button
                  key={o.value}
                  disabled={updating}
                  onClick={() => setStatus(o.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer disabled:opacity-60',
                    status === o.value ? o.active : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
                  )}
                >
                  <o.icon className="w-3.5 h-3.5" /> {o.label}
                </button>
              ))}
            </div>
            <a
              href={problem.leetcodeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-semibold"
            >
              Solve on LeetCode <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <ProblemDescription problemId={problem.id} leetcodeUrl={problem.leetcodeUrl} />

        {/* Companies */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <Building2 className="w-3.5 h-3.5" /> Asked at {companies.length} companies
          </h2>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {companies.map(c => (
              <Link
                key={c}
                href={`/companies/${encodeURIComponent(c)}`}
                className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-2 py-1 rounded"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>

        {/* Note */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <StickyNote className="w-3.5 h-3.5" /> Personal note
            </h2>
            <span className="text-[10px] text-zinc-400">Remiel can read this for context</span>
          </div>
          <Textarea
            value={note}
            onChange={e => {
              setNote(e.target.value);
              setNoteDirty(true);
            }}
            placeholder="Your approach, gotchas, complexity…"
            className="min-h-[120px] rounded-lg text-sm"
          />
          {noteDirty && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="h-8 px-3 rounded-lg" onClick={() => { setNote(savedNote); setNoteDirty(false); }}>Discard</Button>
              <Button onClick={saveNote} disabled={savingNote} className="h-8 px-4 rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
                {savingNote ? 'Saving…' : 'Save note'}
              </Button>
            </div>
          )}
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Similar problems</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/problems/${r.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                >
                  <span className="text-xs font-medium truncate">{r.title}</span>
                  <span className={cn('shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border', DIFF_STYLES[r.difficulty])}>{r.difficulty}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right: Remiel */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <RemielChat
          scope={`problem:${problem.id}`}
          problemId={problem.id}
          getContext={getContext}
          heading="Remiel"
          subheading={`Focused on · ${problem.title}`}
          className="h-[70vh] lg:h-[calc(100vh-4rem)]"
          suggestions={[
            'Give me a hint to get started',
            'What pattern does this problem use?',
            'What edge cases should I handle?',
            'Explain the optimal complexity',
          ]}
        />
      </div>
    </div>
  );
}
