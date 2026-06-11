'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { Problem, UserProgress } from '@/types';

interface DataContextType {
  problems: Problem[];
  userProgress: Record<string, UserProgress>;
  loading: boolean;
}

const DataContext = createContext<DataContextType>({
  problems: [],
  userProgress: {},
  loading: true,
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { userData } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const CACHE_KEY = 'trackcode_problems_cache';
        const CACHE_TIME_KEY = 'trackcode_problems_cache_time';
        const EXPIRE_TIME = 24 * 60 * 60 * 1000;

        const cached = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
        const cachedTime = typeof window !== 'undefined' ? localStorage.getItem(CACHE_TIME_KEY) : null;
        const now = Date.now();

        if (cached && cachedTime && (now - Number(cachedTime) < EXPIRE_TIME)) {
          setProblems(JSON.parse(cached));
          return;
        }

        const res = await fetch('/problems.json');
        if (!res.ok) throw new Error("Failed to load static problems list");
        const ps: Problem[] = await res.json();
        
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

    return () => {
      unsubProg();
    };
  }, [userData?.uid]);

  return (
    <DataContext.Provider value={{ problems, userProgress, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
