import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Note } from '@/types';

export function useUserNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotes({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const qNotes = query(collection(db, 'notes'), where('userId', '==', userId));
    const unsub = onSnapshot(qNotes, (snap) => {
      const n: Record<string, string> = {};
      snap.forEach(d => {
        const data = d.data() as Note;
        n[data.problemId] = data.content;
      });
      setNotes(n);
      setLoading(false);
    }, (e) => {
      console.error("Notes subscription error", e);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { notes, loading };
}
