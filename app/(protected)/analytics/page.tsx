'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { useMemo } from 'react';
import { Problem, UserProgress, DailyActivity } from '@/types';

const COLORS = ['#FF6B35', '#0A0A0A', '#E8E8E8'];

export default function AnalyticsPage() {
  const { userData } = useAuth();
  const { problems, userProgress, activity, loading } = useData();

  const difficultyData = useMemo(() => {
    const problemMap: Record<string, string> = {};
    problems.forEach(p => {
      problemMap[p.id] = p.difficulty;
    });
    
    const diffCounts = { EASY: 0, MEDIUM: 0, HARD: 0 };
    Object.values(userProgress).forEach(prog => {
      if (prog.status === 'done') {
        const diff = problemMap[prog.problemId];
        if (diff) diffCounts[diff as keyof typeof diffCounts]++;
      }
    });

    return [
      { name: 'Easy', value: diffCounts.EASY },
      { name: 'Medium', value: diffCounts.MEDIUM },
      { name: 'Hard', value: diffCounts.HARD },
    ];
  }, [problems, userProgress]);

  const weeklyData = useMemo(() => {
    const actMap: Record<string, number> = {};
    activity.forEach(act => {
      actMap[act.date] = act.problemsSolved;
    });

    const weekly: any[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      weekly.push({
         day: dayName,
         solved: actMap[dateStr] || 0
      });
    }
    return weekly;
  }, [activity]);

  const hasData = difficultyData.some(d => d.value > 0) || weeklyData.some(d => d.solved > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Intelligence</h1>
        <p className="text-muted-foreground text-sm">Your progress, visualized</p>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
           <div className="card-elevated h-80 animate-pulse bg-muted" />
           <div className="card-elevated h-80 animate-pulse bg-muted" />
        </div>
      ) : !hasData ? (
        <div className="py-16 text-center space-y-4 rounded-2xl border-2 border-dashed border-border bg-secondary/50">
           <h2 className="text-2xl font-bold text-muted-foreground">No data yet</h2>
           <p className="text-muted-foreground text-sm max-w-sm mx-auto">Solved problems will appear here once you begin your preparation journey</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-elevated overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">Difficulty Spread</h2>
            </div>
            <div className="h-80 pt-6 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '0.75rem', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#FFFFFF',
                      fontFamily: 'monospace'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-elevated overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">Weekly Velocity</h2>
            </div>
            <div className="h-80 pt-6 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#686868' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 107, 53, 0.05)' }}
                    contentStyle={{ 
                      borderRadius: '0.75rem', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#FFFFFF',
                      fontFamily: 'monospace'
                    }} 
                  />
                  <Bar dataKey="solved" fill="#FF6B35" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
