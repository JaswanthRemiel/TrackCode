import React from 'react';
import { Flame } from 'lucide-react';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakWidget({ currentStreak, longestStreak }: StreakWidgetProps) {
  return (
    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 uppercase tracking-tighter">
        <Flame className="w-5 h-5 text-accent" />
        <div>
          <p className="text-[10px] font-bold text-slate-400">Streak</p>
          <p className="text-xl font-serif font-black">{(currentStreak ?? 0)} {(currentStreak === 1) ? 'day' : 'days'}</p>
        </div>
      </div>
      <div className="h-8 w-px bg-black/5" />
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400">Best</p>
          <p className="text-lg font-serif font-black text-slate-300">{(longestStreak ?? 0)}</p>
        </div>
      </div>
    </div>
  );
}
