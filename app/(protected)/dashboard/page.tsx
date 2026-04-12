'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { ContributionGraph } from '@/components/contribution-graph';
import { StreakWidget } from '@/components/streak-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { DailyActivity } from '@/types';

export default function DashboardPage() {
  const { userData } = useAuth();
  const { activity, loading } = useData();

  const activityData = useMemo(() => {
    const data: any[] = activity.map(act => {
      let level = 0;
      if (act.problemsSolved > 1) level = 1;
      if (act.problemsSolved > 3) level = 2;
      if (act.problemsSolved > 5) level = 3;
      if (act.problemsSolved > 8) level = 4;
      
      return {
        date: act.date,
        count: act.problemsSolved,
        level
      };
    });

    return fillMissingDates(data);
  }, [activity]);

  if (!userData) return null;

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-serif">Your Performance.</h1>
          <p className="text-slate-500 font-medium italic">Welcome back, {userData.email}</p>
        </div>
        <StreakWidget currentStreak={userData.currentStreak} longestStreak={userData.longestStreak} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-8 border-black/5 shadow-xl shadow-black/[0.02]">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Solved</p>
            <div className="flex items-baseline gap-2">
               <span className="text-6xl font-serif">{userData.totalSolved}</span>
               <span className="text-slate-400 font-medium">Problems</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-black/5 shadow-xl shadow-black/[0.02] overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-black/5">
          <CardTitle className="text-xl md:text-2xl font-serif">Activity Roadmap</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {loading ? (
            <div className="h-[150px] flex items-center justify-center text-slate-400 italic">Preparing your data...</div>
          ) : (
            <div className="overflow-x-auto pb-4 scrollbar-hide">
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
