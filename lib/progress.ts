import { db } from '@/lib/firebase';
import { ProgressStatus, User, UserProgress } from '@/types';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Updates a problem's status and keeps daily activity, totals and streaks in sync.
 * Same behaviour as the problems/company tables.
 */
export async function updateProblemStatus(
  userData: User,
  progress: Record<string, UserProgress>,
  problemId: string,
  status: ProgressStatus,
) {
  const progDoc: UserProgress = { userId: userData.uid, problemId, status };
  if (status === 'done') progDoc.completedAt = Date.now();

  await setDoc(doc(db, 'userProgress', `${userData.uid}_${problemId}`), progDoc);

  const prevStatus = progress[problemId]?.status || 'todo';
  const isNewDone = status === 'done' && prevStatus !== 'done';
  const isUndoDone = status !== 'done' && prevStatus === 'done';
  if (!isNewDone && !isUndoDone) return;

  const change = isNewDone ? 1 : -1;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA');

  let targetDateStr = dateStr;
  const completedAt = progress[problemId]?.completedAt;
  if (isUndoDone && completedAt) targetDateStr = new Date(completedAt).toLocaleDateString('en-CA');

  await setDoc(
    doc(db, 'dailyActivity', `${userData.uid}_${targetDateStr}`),
    { date: targetDateStr, userId: userData.uid, problemsSolved: increment(change) },
    { merge: true },
  );

  const userUpdates: Record<string, unknown> = { totalSolved: increment(change) };

  if (isNewDone) {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');
    const lastActive = userData.lastActiveDate;
    const currentStreak = Number(userData.currentStreak) || 0;
    const longestStreak = Number(userData.longestStreak) || 0;

    if (lastActive !== dateStr) {
      const nextStreak = lastActive === yesterdayStr ? currentStreak + 1 : 1;
      userUpdates.currentStreak = nextStreak;
      if (nextStreak > longestStreak) userUpdates.longestStreak = nextStreak;
      userUpdates.lastActiveDate = dateStr;
    }
  }

  await updateDoc(doc(db, 'users', userData.uid), userUpdates);
}
