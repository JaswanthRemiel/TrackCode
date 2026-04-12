'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { useMemo } from 'react';
import { Problem, UserProgress, DailyActivity } from '@/types';

const COLORS = ['#111111', '#FF4D00', '#666666'];

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
    <div className="space-y-6 md:space-y-12 pb-20 px-4 md:px-0">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-serif">Intelligence.</h1>
        <p className="text-slate-500 font-medium italic">Your progress, visualized.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
           <Card className="h-[300px] md:h-[450px] border-black/5 shadow-xl shadow-black/[0.02] animate-pulse bg-slate-50/50" />
           <Card className="h-[300px] md:h-[450px] border-black/5 shadow-xl shadow-black/[0.02] animate-pulse bg-slate-50/50" />
        </div>
      ) : !hasData ? (
        <div className="py-20 text-center space-y-4 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
           <h2 className="text-3xl font-serif text-slate-400 italic font-medium">Static Silence.</h2>
           <p className="text-slate-500 max-w-sm mx-auto">Solved problems will appear here once you begin your preparation journey.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-black/5 shadow-xl shadow-black/[0.02] overflow-hidden">
            <CardHeader className="p-6 md:p-8 border-b border-black/5">
              <CardTitle className="text-xl md:text-2xl font-serif">Difficulty Spread</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] pt-8 p-4 md:p-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '1rem', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontFamily: 'Instrument Serif'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-black/5 shadow-xl shadow-black/[0.02] overflow-hidden">
            <CardHeader className="p-6 md:p-8 border-b border-black/5">
              <CardTitle className="text-xl md:text-2xl font-serif">Weekly Velocity</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] pt-8 p-4 md:p-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#F9F9F9' }}
                    contentStyle={{ 
                      borderRadius: '1rem', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontFamily: 'Instrument Serif'
                    }} 
                  />
                  <Bar dataKey="solved" fill="#111111" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
