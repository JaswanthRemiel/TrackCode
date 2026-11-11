'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { useRemielSettings } from '@/lib/ai/settings';
import { generateRemielPlan } from '@/lib/ai/client';
import { PlanRequest, RemielPlan } from '@/lib/ai/types';
import { deletePlan, planDayIndex, savePlan } from '@/hooks/useRemiel';
import { RemielSettingsDialog } from './SettingsDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Problem } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarDays, CheckCircle2, ChevronDown, Circle, Loader2, RotateCcw, Sparkles, Trash2, Wand2 } from 'lucide-react';

const ANY = '__any__';
const DIFF_DOT = { EASY: 'bg-emerald-500', MEDIUM: 'bg-amber-500', HARD: 'bg-rose-500' } as const;

export function PlannerForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { userData } = useAuth();
  const { problems, userProgress } = useData();
  const { settings, configured } = useRemielSettings();

  const [company, setCompany] = useState('');
  const [days, setDays] = useState(14);
  const [perDay, setPerDay] = useState(3);
  const [difficulty, setDifficulty] = useState<PlanRequest['difficulty']>('balanced');
  const [topics, setTopics] = useState<string[]>([]);
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const { companies, tags } = useMemo(() => {
    const cCount = new Map<string, number>();
    const tCount = new Map<string, number>();
    for (const p of problems) {
      for (const c of (Array.isArray(p.company) ? p.company : [p.company]) as string[]) cCount.set(c, (cCount.get(c) ?? 0) + 1);
      for (const t of p.tags) tCount.set(t, (tCount.get(t) ?? 0) + 1);
    }
    const sort = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
    return { companies: sort(cCount), tags: sort(tCount) };
  }, [problems]);

  const companyValid = !company.trim() || companies.some(c => c.toLowerCase() === company.trim().toLowerCase());
  const shownTags = showAllTopics ? tags : tags.slice(0, 18);

  const generate = async () => {
    if (!userData) return;
    if (!configured) {
      setSettingsOpen(true);
      return;
    }
    if (!companyValid) {
      setError('Pick a company from the list (or leave it empty for general prep).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const matched = companies.find(c => c.toLowerCase() === company.trim().toLowerCase());
      const entries = Object.values(userProgress);
      const plan = await generateRemielPlan(settings, {
        company: matched ?? ANY,
        days,
        perDay,
        difficulty,
        focusTopics: topics,
        goal: goal.trim() || undefined,
        doneIds: entries.filter(e => e.status === 'done').map(e => e.problemId),
        revisionIds: entries.filter(e => e.status === 'revision').map(e => e.problemId),
      });
      const id = await savePlan({
        ...plan,
        userId: userData.uid,
        startDate: new Date().toLocaleDateString('en-CA'),
        createdAt: Date.now(),
      });
      onCreated(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 md:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold tracking-tight">Build a plan with Remiel</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="plan-company" className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Target company</Label>
          <Input
            id="plan-company"
            list="plan-companies"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="e.g. Google (leave empty for general prep)"
            className={cn('h-10 rounded-lg text-sm', !companyValid && 'border-rose-400')}
          />
          <datalist id="plan-companies">
            {companies.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Days · {days}</Label>
          <input type="range" min={3} max={60} value={days} onChange={e => setDays(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Problems / day · {perDay}</Label>
          <input type="range" min={1} max={8} value={perDay} onChange={e => setPerDay(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Difficulty curve</Label>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['easy-first', 'Easy → Hard'],
              ['balanced', 'Balanced'],
              ['hard-focus', 'Hard focus'],
            ] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setDifficulty(v)}
                className={cn(
                  'h-9 rounded-lg border text-xs font-semibold cursor-pointer transition-colors',
                  difficulty === v ? 'border-accent bg-accent/10' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Focus topics (optional)</Label>
          <div className="flex flex-wrap gap-1.5">
            {shownTags.map(t => {
              const on = topics.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopics(ts => (on ? ts.filter(x => x !== t) : ts.length < 12 ? [...ts, t] : ts))}
                  className={cn(
                    'px-2 py-1 rounded-md border text-[10px] font-semibold cursor-pointer transition-colors',
                    on ? 'border-accent bg-accent text-accent-foreground' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
                  )}
                >
                  {t}
                </button>
              );
            })}
            {tags.length > 18 && (
              <button type="button" onClick={() => setShowAllTopics(s => !s)} className="px-2 py-1 text-[10px] font-semibold text-accent cursor-pointer">
                {showAllTopics ? 'Show less' : `+${tags.length - 18} more`}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="plan-goal" className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Anything else? (optional)</Label>
          <Input
            id="plan-goal"
            value={goal}
            maxLength={400}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. Onsite in 3 weeks, weak at DP and graphs"
            className="h-10 rounded-lg text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      <button
        onClick={generate}
        disabled={busy}
        className="w-full h-11 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? 'Remiel is planning…' : configured ? `Generate ${days * perDay}-problem plan` : 'Add your key and model to generate'}
      </button>

      <RemielSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

export function PlanView({ plan }: { plan: RemielPlan }) {
  const { problems, userProgress } = useData();
  const byId = useMemo(() => new Map<string, Problem>(problems.map(p => [p.id, p])), [problems]);
  const today = planDayIndex(plan);
  const [open, setOpen] = useState<Set<number>>(() => new Set([today]));

  const all = plan.days.flatMap(d => d.problemIds);
  const doneCount = all.filter(id => userProgress[id]?.status === 'done').length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;

  const toggle = (i: number) =>
    setOpen(s => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="p-5 md:p-6 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{plan.company} · {plan.days.length} days</p>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{plan.title}</h2>
            {plan.summary && <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">{plan.summary}</p>}
          </div>
          <button
            onClick={() => {
              if (confirm('Delete this plan?')) deletePlan(plan.id);
            }}
            className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer shrink-0"
            aria-label="Delete plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
            <span>{doneCount} / {all.length} solved</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {plan.days.map((d, i) => {
          const dayDone = d.problemIds.filter(id => userProgress[id]?.status === 'done').length;
          const complete = dayDone === d.problemIds.length;
          const isOpen = open.has(i);
          const date = new Date(`${plan.startDate}T00:00:00`);
          date.setDate(date.getDate() + i);
          return (
            <div key={d.day} className={cn(i === today && 'bg-accent/[0.04]')}>
              <button onClick={() => toggle(i)} className="w-full flex items-center gap-3 px-5 md:px-6 py-3 text-left cursor-pointer hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                <div
                  className={cn(
                    'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-bold border',
                    complete ? 'bg-emerald-500 text-white border-transparent' : i === today ? 'border-accent text-accent' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500',
                  )}
                >
                  {complete ? <CheckCircle2 className="w-4 h-4" /> : d.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {d.theme}
                    {i === today && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-accent">Today</span>}
                  </p>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {dayDone}/{d.problemIds.length}
                  </p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="px-5 md:px-6 pb-4 pl-[4.25rem] md:pl-[4.75rem] space-y-2">
                  {d.tip && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">💡 {d.tip}</p>}
                  {d.problemIds.map(id => {
                    const p = byId.get(id);
                    const st = userProgress[id]?.status ?? 'todo';
                    const Icon = st === 'done' ? CheckCircle2 : st === 'revision' ? RotateCcw : Circle;
                    return (
                      <Link
                        key={id}
                        href={`/problems/${id}`}
                        className="flex items-center gap-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                      >
                        <Icon className={cn('w-4 h-4 shrink-0', st === 'done' ? 'text-emerald-500' : st === 'revision' ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700')} />
                        <span className={cn('text-xs font-medium flex-1 truncate', st === 'done' && 'line-through text-zinc-400')}>{p?.title ?? id}</span>
                        {p && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DIFF_DOT[p.difficulty])} title={p.difficulty} />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
