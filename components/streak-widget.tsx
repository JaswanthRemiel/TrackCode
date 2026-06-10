'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakWidget({ currentStreak, longestStreak }: StreakWidgetProps) {
  return (
    <div className="flex items-center gap-5 bg-white dark:bg-card border border-black/5 dark:border-white/5 rounded-2xl px-6 py-4 shadow-xl shadow-black/[0.02] dark:shadow-black/20 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Flame className="w-5 h-5 text-accent flame-pulse" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">Current Streak</p>
          <p className="text-2xl font-serif font-black leading-none">{currentStreak ?? 0} <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">{currentStreak === 1 ? 'day' : 'days'}</span></p>
        </div>
      </div>
      <div className="h-10 w-px bg-black/5 dark:bg-white/10" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">Best</p>
        <p className="text-xl font-serif font-black text-slate-300 dark:text-slate-600 leading-none">{longestStreak ?? 0}</p>
      </div>
    </div>
  );
}
