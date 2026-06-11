'use client';

import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import 'react-activity-calendar/tooltips.css';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const customTheme: ThemeInput = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  };

  const colorScheme = mounted && theme === 'dark' ? 'dark' : 'light';

  return (
    <div className="w-full flex justify-center">
      <ActivityCalendar
        data={data}
        theme={customTheme}
        colorScheme={colorScheme}
        tooltips={{
          activity: {
            text: (activity) => {
              const date = new Date(activity.date);
              const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              return `${activity.count} ${activity.count === 1 ? 'problem' : 'problems'} solved on ${formattedDate}`;
            },
          },
        }}
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
