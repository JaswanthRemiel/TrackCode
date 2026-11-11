'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakWidget({ currentStreak, longestStreak }: StreakWidgetProps) {
  return (
    <div className="flex flex-row items-center gap-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 leading-none mb-1">Current Streak</p>
          <p className="text-xl font-bold leading-none text-zinc-900 dark:text-zinc-50">{currentStreak ?? 0} <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">{currentStreak === 1 ? 'day' : 'days'}</span></p>
        </div>
      </div>
      <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
      <div>
        <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 leading-none mb-1">Best</p>
        <p className="text-lg font-bold text-zinc-500 dark:text-zinc-400 leading-none">{longestStreak ?? 0}</p>
      </div>
    </div>
  );
}

