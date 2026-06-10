'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis } from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { useMemo } from 'react';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

const LIGHT_COLORS = ['#111111', '#FF4D00', '#666666'];
const DARK_COLORS = ['#e5e5e5', '#FF4D00', '#888888'];

export default function AnalyticsPage() {
  const { userData } = useAuth();
  const { problems, userProgress, activity, loading } = useData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

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
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-6xl font-serif">Intelligence.</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Your progress, visualized.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
           <Card className="h-[300px] md:h-[450px] border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 animate-pulse bg-slate-50/50 dark:bg-white/[0.02]" />
           <Card className="h-[300px] md:h-[450px] border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 animate-pulse bg-slate-50/50 dark:bg-white/[0.02]" />
        </div>
      ) : !hasData ? (
        <div className="py-24 text-center space-y-6 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-white/50 dark:bg-white/[0.02]">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-slate-400 dark:text-slate-500 italic font-medium">Static Silence.</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Solved problems will appear here once you begin your preparation journey.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 overflow-hidden card-glow transition-colors duration-300">
            <CardHeader className="p-6 md:p-8 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4 text-accent" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-serif">Difficulty Spread</CardTitle>
              </div>
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
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '1rem', 
                      border: 'none', 
                      boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.15)',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                      color: isDark ? '#e5e5e5' : '#111111',
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 overflow-hidden card-glow transition-colors duration-300">
            <CardHeader className="p-6 md:p-8 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-serif">Weekly Velocity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-[350px] pt-8 p-4 md:p-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#666' : '#94a3b8', fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: isDark ? '#1a1a1a' : '#F9F9F9', radius: 8 }}
                    contentStyle={{ 
                      borderRadius: '1rem', 
                      border: 'none', 
                      boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.15)',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                      color: isDark ? '#e5e5e5' : '#111111',
                    }} 
                  />
                  <Bar dataKey="solved" fill={isDark ? '#e5e5e5' : '#111111'} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
