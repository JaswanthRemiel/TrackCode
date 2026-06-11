'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { ContributionGraph } from '@/components/contribution-graph';
import { StreakWidget } from '@/components/streak-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { Building2, CheckCircle } from 'lucide-react';
import { useUserActivity } from '@/hooks/useUserActivity';

export default function DashboardPage() {
  const { userData } = useAuth();
  const { problems, userProgress, loading: dataLoading } = useData();
  const { activity, loading: activityLoading } = useUserActivity(userData?.uid);

  const loading = dataLoading || activityLoading;

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-serif">Your Performance.</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Welcome back, {userData.email}</p>
        </div>
        <StreakWidget currentStreak={userData.currentStreak} longestStreak={userData.longestStreak} />
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 md:p-8 border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 card-glow transition-colors duration-300">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Solved</p>
            <div className="flex items-baseline gap-2">
               <span className="text-5xl md:text-6xl font-serif">{userData.totalSolved}</span>
               <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">problems</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8 border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 card-glow transition-colors duration-300">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Companies</p>
            <div className="flex items-baseline gap-2">
               <span className="text-5xl md:text-6xl font-serif">{companiesTracked}</span>
               <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">tracked</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8 border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 card-glow col-span-2 lg:col-span-1 transition-colors duration-300">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Today</p>
            <div className="flex items-baseline gap-2">
               <span className="text-5xl md:text-6xl font-serif">
                {activity.find(a => a.date === new Date().toLocaleDateString('en-CA'))?.problemsSolved ?? 0}
               </span>
               <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">solved</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Contribution Graph */}
      <Card className="border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 overflow-hidden card-glow transition-colors duration-300">
        <CardHeader className="p-6 md:p-8 border-b border-black/5 dark:border-white/5">
          <CardTitle className="text-xl md:text-2xl font-serif">Activity Roadmap</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {loading ? (
            <div className="h-[150px] flex items-center justify-center text-slate-400 dark:text-slate-500 italic">Preparing your data...</div>
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
