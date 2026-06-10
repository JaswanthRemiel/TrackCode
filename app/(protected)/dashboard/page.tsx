'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { ContributionGraph } from '@/components/contribution-graph';
import { StreakWidget } from '@/components/streak-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { DailyActivity } from '@/types';

export default function DashboardPage() {
  const { userData } = useAuth();
  const { activity, loading } = useData();
  const activityData = useMemo(() => {
    const data: any[] = activity.map(act => {
      const solved = Math.max(0, act.problemsSolved);
      let level = 0;
      if (solved > 1) level = 1;
      if (solved > 3) level = 2;
      if (solved > 5) level = 3;
      if (solved > 8) level = 4;
      
      return {
        date: act.date,
        count: solved,
        level
      };
    });

    return fillMissingDates(data);
  }, [activity]);

  if (!userData) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-balance">Your Performance</h1>
          <p className="text-muted-foreground font-medium">Welcome back, {userData.email?.split('@')[0]}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Solved Card */}
        <div className="card-elevated p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Solved</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-accent">{userData.totalSolved}</span>
            <span className="text-sm text-muted-foreground">problems</span>
          </div>
        </div>

        {/* Current Streak Card */}
        <div className="card-elevated p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Streak</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-accent">{userData.currentStreak}</span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>

        {/* Longest Streak Card */}
        <div className="card-elevated p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Longest Streak</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-accent">{userData.longestStreak}</span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>
      </div>

      {/* Activity Roadmap */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Activity Roadmap</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              <span className="text-sm font-medium">Preparing your data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="min-w-[800px] md:min-w-0 pb-2">
                <ContributionGraph data={activityData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fillMissingDates(existingData: any[]) {
  const map = new Map();
  existingData.forEach(d => map.set(d.date, d));

  const result = [];
  const today = new Date();
  for (let i = 365; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    if (map.has(dateStr)) {
      result.push(map.get(dateStr));
    } else {
      result.push({
        date: dateStr,
        count: 0,
        level: 0
      });
    }
  }
  return result;
}
