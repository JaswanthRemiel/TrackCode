import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { DailyActivity } from '@/types';

export function useUserActivity(userId: string | undefined) {
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setActivity([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const qAct = query(collection(db, 'dailyActivity'), where('userId', '==', userId));
    const unsub = onSnapshot(qAct, (snap) => {
      const a: DailyActivity[] = [];
      snap.forEach(d => a.push(d.data() as DailyActivity));
      setActivity(a);
      setLoading(false);
    }, (e) => {
      console.error("Activity subscription error", e);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { activity, loading };
}
