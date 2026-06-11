'use client';

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { useUserActivity } from '@/hooks/useUserActivity';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { DailyActivity } from '@/types';

function calculateStreaks(activity: DailyActivity[]) {
  // 1. Filter activities where problemsSolved > 0
  const activeDates = activity
    .filter(act => act.problemsSolved > 0)
    .map(act => act.date)
    .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Parse YYYY-MM-DD into a local Date object
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Format Date object to YYYY-MM-DD in local time
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatLocalDate(new Date());
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  // 2. Calculate current streak
  let currentStreak = 0;
  const mostRecentDate = activeDates[0];

  if (mostRecentDate === todayStr || mostRecentDate === yesterdayStr) {
    currentStreak = 1;
    let expectedDate = parseLocalDate(mostRecentDate);
    
    for (let i = 1; i < activeDates.length; i++) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      const expectedStr = formatLocalDate(expectedDate);
      
      if (activeDates[i] === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // 3. Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  let expectedDate = parseLocalDate(activeDates[0]);

  for (let i = 1; i < activeDates.length; i++) {
    expectedDate.setDate(expectedDate.getDate() - 1);
    const expectedStr = formatLocalDate(expectedDate);

    if (activeDates[i] === expectedStr) {
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      tempStreak = 1;
      expectedDate = parseLocalDate(activeDates[i]);
    }
  }
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }

  return { currentStreak, longestStreak };
}

export function UserStatsSync() {
  const { userData } = useAuth();
  const { userProgress, loading: dataLoading } = useData();
  const { activity, loading: activityLoading } = useUserActivity(userData?.uid);

  const loading = dataLoading || activityLoading;

  const totalSolved = useMemo(() => {
    return Object.values(userProgress).filter(p => p.status === 'done').length;
  }, [userProgress]);

  const { currentStreak, longestStreak } = useMemo(() => {
    return calculateStreaks(activity);
  }, [activity]);

  useEffect(() => {
    if (!loading && userData) {
      const updates: any = {};
      let needsUpdate = false;

      if (userData.totalSolved !== totalSolved) {
        updates.totalSolved = totalSolved;
        needsUpdate = true;
      }
      if ((userData.currentStreak ?? 0) !== currentStreak) {
        updates.currentStreak = currentStreak;
        needsUpdate = true;
      }
      if ((userData.longestStreak ?? 0) !== longestStreak) {
        updates.longestStreak = longestStreak;
        needsUpdate = true;
      }

      if (needsUpdate) {
        updateDoc(doc(db, 'users', userData.uid), updates)
          .catch(err => console.error("Failed to self-heal user stats:", err));
      }
    }
  }, [loading, userData, totalSolved, currentStreak, longestStreak]);

  return null;
}
