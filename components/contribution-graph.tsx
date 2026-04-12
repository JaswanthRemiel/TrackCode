'use client';

import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import { useTheme } from 'next-themes';

interface DailyActivityData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ContributionGraphProps {
  data: DailyActivityData[];
}

export function ContributionGraph({ data }: ContributionGraphProps) {
  const { theme } = useTheme();
  

  const customTheme: ThemeInput = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  };

  const isDark = theme === 'dark' || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="w-full flex justify-center p-4 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <ActivityCalendar
        data={data}
        theme={customTheme}
        colorScheme={isDark ? 'dark' : 'light'}
        labels={{
          legend: {
            less: 'Less',
            more: 'More'
          },
          months: [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
          ],
          totalCount: '{{count}} problems solved in the last year',
        }}
      />
    </div>
  );
}
