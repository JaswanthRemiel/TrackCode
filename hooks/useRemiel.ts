'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { ChatMessage, RemielChat, RemielPlan } from '@/lib/ai/types';

const CHATS = 'remielChats';
const PLANS = 'remielPlans';
const MAX_STORED_MESSAGES = 200;
const EMPTY_CHATS: RemielChat[] = [];
const EMPTY_PLANS: RemielPlan[] = [];

/** Subscribes to the user's Remiel chats for one scope ('general' or `problem:<id>`), newest first. */
export function useRemielChats(userId: string | undefined, scope: string) {
  const key = userId ? `${userId}|${scope}` : null;
  // Results are tagged with the key they belong to, so stale data is never shown after a switch.
  const [state, setState] = useState<{ key: string | null; chats: RemielChat[] }>({ key: null, chats: [] });

  useEffect(() => {
    if (!userId || !key) return;
    const q = query(collection(db, CHATS), where('userId', '==', userId), where('scope', '==', scope));
    return onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => ({ ...(d.data() as RemielChat), id: d.id }));
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        setState({ key, chats: list });
      },
      e => {
        console.error('Remiel chats subscription error', e);
        setState({ key, chats: [] });
      },
    );
  }, [userId, scope, key]);

  const fresh = key !== null && state.key === key;
  return { chats: fresh ? state.chats : EMPTY_CHATS, loading: key !== null && !fresh };
}

export function newChatId() {
  return doc(collection(db, CHATS)).id;
}

export async function saveChat(chat: RemielChat) {
  await setDoc(doc(db, CHATS, chat.id), {
    ...chat,
    messages: chat.messages.slice(-MAX_STORED_MESSAGES).map((m: ChatMessage) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt ?? Date.now(),
    })),
  });
}

export async function deleteChat(id: string) {
  await deleteDoc(doc(db, CHATS, id));
}

export function useRemielPlans(userId: string | undefined) {
  const [state, setState] = useState<{ key: string | null; plans: RemielPlan[] }>({ key: null, plans: [] });

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, PLANS), where('userId', '==', userId));
    return onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => ({ ...(d.data() as RemielPlan), id: d.id }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setState({ key: userId, plans: list });
      },
      e => {
        console.error('Remiel plans subscription error', e);
        setState({ key: userId, plans: [] });
      },
    );
  }, [userId]);

  const fresh = Boolean(userId) && state.key === userId;
  return { plans: fresh ? state.plans : EMPTY_PLANS, loading: Boolean(userId) && !fresh };
}

export async function savePlan(plan: Omit<RemielPlan, 'id'>) {
  const ref = doc(collection(db, PLANS));
  await setDoc(ref, plan);
  return ref.id;
}

export async function deletePlan(id: string) {
  await deleteDoc(doc(db, PLANS, id));
}

/** Index of "today" within a plan, clamped to its length. */
export function planDayIndex(plan: Pick<RemielPlan, 'startDate' | 'days'>) {
  const start = new Date(`${plan.startDate}T00:00:00`);
  const today = new Date(`${new Date().toLocaleDateString('en-CA')}T00:00:00`);
  const diff = Math.round((today.getTime() - start.getTime()) / 86_400_000);
  return Math.min(Math.max(diff, 0), Math.max(plan.days.length - 1, 0));
}
