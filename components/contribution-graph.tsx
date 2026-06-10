'use client';

import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
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
    light: ['#f0f0f0', '#ffcdb2', '#ff9b6a', '#ff6b2b', '#FF4D00'],
    dark: ['#1a1a1a', '#4a2000', '#7a3500', '#b05000', '#FF4D00'],
  };

  const colorScheme = mounted && theme === 'dark' ? 'dark' : 'light';

  return (
    <div className="w-full flex justify-center">
      <ActivityCalendar
        data={data}
        theme={customTheme}
        colorScheme={colorScheme}
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
