'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { User } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubsDocs: any = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        

        unsubsDocs = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ ...docSnap.data(), uid: firebaseUser.uid } as User);
          } else {

            const fallbackUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              createdAt: Date.now(),
              currentStreak: 0,
              longestStreak: 0,
              totalSolved: 0,
            };
            try {
              await setDoc(docRef, fallbackUser);
              setUserData(fallbackUser);
            } catch (e) {
              console.error("Failed to self-heal missing user doc", e);
              setUserData(fallbackUser);
            }
          }
        });
      } else {
        if (unsubsDocs) unsubsDocs();
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubsDocs) unsubsDocs();
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
