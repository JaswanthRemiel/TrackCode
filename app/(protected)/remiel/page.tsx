'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { planDayIndex, useRemielPlans } from '@/hooks/useRemiel';
import { PlannerForm, PlanView } from '@/components/remiel/Planner';
import { RemielChat } from '@/components/remiel/RemielChat';
import { RemielChatContext } from '@/lib/ai/types';
import { cn } from '@/lib/utils';
import { CalendarRange, MessagesSquare, Plus, Sparkles } from 'lucide-react';

type Tab = 'planner' | 'chat';

export default function RemielPage() {
  const { userData } = useAuth();
  const { problems, userProgress } = useData();
  const { plans, loading } = useRemielPlans(userData?.uid);
  const [tab, setTab] = useState<Tab>('planner');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const selected = plans.find(p => p.id === selectedId) ?? (creating ? undefined : plans[0]);
  const activePlan = plans[0];

  const progress = useMemo(() => {
    const vals = Object.values(userProgress);
    return { solved: vals.filter(v => v.status === 'done').length, revision: vals.filter(v => v.status === 'revision').length, total: problems.length };
  }, [userProgress, problems.length]);

  const getContext = useCallback((): RemielChatContext => {
    const plan = activePlan
      ? (() => {
          const i = planDayIndex(activePlan);
          return { title: activePlan.title, company: activePlan.company, dayIndex: i, totalDays: activePlan.days.length, todayProblemIds: activePlan.days[i]?.problemIds ?? [] };
        })()
      : null;
    return { problemId: null, progress, plan };
  }, [activePlan, progress]);

  if (!userData) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
            <Sparkles className="w-3 h-3" /> AI coach
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Remiel</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
            Plans built from TrackCode&apos;s real problem set and your progress. Open any problem to get hints scoped to it.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1">
          {([
            ['planner', 'Planner', CalendarRange],
            ['chat', 'Ask Remiel', MessagesSquare],
          ] as const).map(([v, l, Icon]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={cn(
                'inline-flex items-center gap-2 px-4 h-9 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                tab === v ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {l}
            </button>
          ))}
        </div>
      </div>

      {tab === 'planner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
          <aside className="space-y-2">
            <button
              onClick={() => {
                setCreating(true);
                setSelectedId(null);
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg border px-3 h-10 text-xs font-semibold cursor-pointer transition-colors',
                !selected ? 'border-accent bg-accent/10' : 'border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
              )}
            >
              <Plus className="w-3.5 h-3.5" /> New plan
            </button>
            {plans.map(p => {
              const ids = p.days.flatMap(d => d.problemIds);
              const done = ids.filter(id => userProgress[id]?.status === 'done').length;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id);
                    setCreating(false);
                  }}
                  className={cn(
                    'w-full text-left rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                    selected?.id === p.id ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-950' : 'border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-950',
                  )}
                >
                  <p className="text-xs font-semibold truncate">{p.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{p.company} · {done}/{ids.length} done</p>
                </button>
              );
            })}
            {loading && <p className="text-[11px] text-zinc-400 px-1">Loading plans…</p>}
          </aside>

          <div className="min-w-0">
            {selected ? (
              <PlanView key={selected.id} plan={selected} />
            ) : (
              <PlannerForm
                onCreated={id => {
                  setSelectedId(id);
                  setCreating(false);
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <RemielChat
          scope="general"
          getContext={getContext}
          className="h-[calc(100vh-18rem)] min-h-[480px]"
          suggestions={[
            activePlan ? "What should I focus on in today's plan?" : 'How should I structure a 4-week prep?',
            'Explain sliding window vs two pointers',
            'When do I use a monotonic stack?',
            'How do I recognise a DP problem?',
          ]}
        />
      )}
    </div>
  );
}
