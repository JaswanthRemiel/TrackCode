'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { ContributionGraph } from '@/components/contribution-graph';
import { StreakWidget } from '@/components/streak-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useEffect } from 'react';
import { Building2, CheckCircle } from 'lucide-react';
import { useUserActivity } from '@/hooks/useUserActivity';
import { LeetCodeStatsWidget } from '@/components/leetcode-stats-widget';
import { AirportClock } from '@/components/airport-clock';

export default function DashboardPage() {
  const { userData } = useAuth();
  const { problems, userProgress, loading: dataLoading } = useData();
  const { activity, loading: activityLoading } = useUserActivity(userData?.uid);

  const loading = dataLoading || activityLoading;

  const totalSolved = useMemo(() => {
    return Object.values(userProgress).filter(p => p.status === 'done').length;
  }, [userProgress]);

  const activityData = useMemo(() => {
    const data: any[] = activity.map(act => {
      const solved = Math.max(0, act.problemsSolved);
      let level: 0 | 1 | 2 | 3 | 4 = 0;
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

  const companiesTracked = useMemo(() => {
    const compSet = new Set<string>();
    Object.values(userProgress)
      .filter(p => p.status === 'done')
      .forEach(prog => {
        const problem = problems.find(p => p.id === prog.problemId);
        if (problem) {
          const comps = Array.isArray(problem.company) ? problem.company : [problem.company];
          comps.forEach(c => { if (c) compSet.add(c); });
        }
      });
    return compSet.size;
  }, [problems, userProgress]);

  if (!userData) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Welcome back, {userData.email}</p>
        </div>
        <StreakWidget currentStreak={userData.currentStreak} longestStreak={userData.longestStreak} />
      </div>

      {/* LeetCode & Airport Clock Row */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeetCodeStatsWidget />
        </div>
        <div className="lg:col-span-1">
          <AirportClock />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-none transition-colors duration-300">
          <div className="space-y-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-50">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Total Solved</p>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{totalSolved}</span>
               <span className="text-zinc-500 dark:text-zinc-400 text-xs">problems</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-none transition-colors duration-300">
          <div className="space-y-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-50">
              <Building2 className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Companies</p>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{companiesTracked}</span>
               <span className="text-zinc-500 dark:text-zinc-400 text-xs">tracked</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-none col-span-2 lg:col-span-1 transition-colors duration-300">
          <div className="space-y-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-50">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Today</p>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {activity.find(a => a.date === new Date().toLocaleDateString('en-CA'))?.problemsSolved ?? 0}
               </span>
               <span className="text-zinc-500 dark:text-zinc-400 text-xs">solved</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Contribution Graph */}
      <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-none overflow-hidden transition-colors duration-300">
        <CardHeader className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Activity Roadmap</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="h-[150px] flex items-center justify-center text-zinc-400 dark:text-zinc-500 italic text-sm">Preparing your data...</div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide pb-2">
               <div className="min-w-[800px] md:min-w-0">
                 <ContributionGraph data={activityData} />
               </div>
            </div>
          )}
        </CardContent>
      </Card>
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
