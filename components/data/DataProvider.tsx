'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { Problem, UserProgress, DailyActivity, Note } from '@/types';

interface DataContextType {
  problems: Problem[];
  userProgress: Record<string, UserProgress>;
  notes: Record<string, string>;
  activity: DailyActivity[];
  loading: boolean;
}

const DataContext = createContext<DataContextType>({
  problems: [],
  userProgress: {},
  notes: {},
  activity: [],
  loading: true,
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { userData } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const CACHE_KEY = 'leettrack_problems_cache';
        const CACHE_TIME_KEY = 'leettrack_problems_cache_time';
        const EXPIRE_TIME = 24 * 60 * 60 * 1000;

        const cached = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
        const cachedTime = typeof window !== 'undefined' ? localStorage.getItem(CACHE_TIME_KEY) : null;
        const now = Date.now();

        if (cached && cachedTime && (now - Number(cachedTime) < EXPIRE_TIME)) {
          setProblems(JSON.parse(cached));
          return;
        }

        const snap = await getDocs(collection(db, 'problems'));
        const ps: Problem[] = [];
        snap.forEach(d => {
          const data = d.data();
          ps.push({ ...data, id: d.id } as Problem);
        });
        
        setProblems(ps);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(ps));
          localStorage.setItem(CACHE_TIME_KEY, now.toString());
        }
      } catch (e) {
        console.error("Failed to fetch problems", e);
      }
    };
    fetchProblems();
  }, []);


  useEffect(() => {
    if (!userData) {
      setUserProgress({});
      setNotes({});
      setActivity([]);
      setLoading(false);
      return;
    }

    setLoading(true);


    const qProg = query(collection(db, 'userProgress'), where('userId', '==', userData.uid));
    const unsubProg = onSnapshot(qProg, (snap) => {
      const prog: Record<string, UserProgress> = {};
      snap.forEach(d => {
        const data = d.data() as UserProgress;
        prog[data.problemId] = data;
      });
      setUserProgress(prog);
      setLoading(false);
    }, (e) => {
      console.error("Progress subscription error", e);
      setLoading(false);
    });


    const qNotes = query(collection(db, 'notes'), where('userId', '==', userData.uid));
    const unsubNotes = onSnapshot(qNotes, (snap) => {
      const n: Record<string, string> = {};
      snap.forEach(d => {
        const data = d.data() as Note;
        n[data.problemId] = data.content;
      });
      setNotes(n);
    }, (e) => console.error("Notes subscription error", e));


    const qAct = query(collection(db, 'dailyActivity'), where('userId', '==', userData.uid));
    const unsubAct = onSnapshot(qAct, (snap) => {
      const a: DailyActivity[] = [];
      snap.forEach(d => a.push(d.data() as DailyActivity));
      setActivity(a);
    }, (e) => console.error("Activity subscription error", e));

    return () => {
      unsubProg();
      unsubNotes();
      unsubAct();
    };
  }, [userData?.uid]);

  return (
    <DataContext.Provider value={{ problems, userProgress, notes, activity, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
