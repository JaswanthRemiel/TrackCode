'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface LeetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeetCodeModal({ isOpen, onClose }: LeetCodeModalProps) {
  const { userData } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userData?.leetcodeUsername) {
      setUsername(userData.leetcodeUsername);
    } else {
      setUsername('');
    }
    setError('');
    setSuccess(false);
  }, [userData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/leetcode?username=${encodeURIComponent(trimmedUsername)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Username not found on LeetCode');
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, 'users', userData.uid), {
        leetcodeUsername: trimmedUsername,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to validate or save username', err);
      setError('Failed to connect to LeetCode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!userData) return;
    setLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        leetcodeUsername: '',
      });
      setUsername('');
      onClose();
    } catch (err: any) {
      console.error('Failed to clear username', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Connect LeetCode Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
            Enter your LeetCode username to sync and display your problem-solving metrics directly on the dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-4 font-sans">
          <div className="space-y-2">
            <Input
              placeholder="e.g. jrxag_official"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || success}
              className="h-10 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-3 py-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-2 rounded-lg">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Profile connected successfully!</span>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            {userData?.leetcodeUsername && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDisconnect}
                disabled={loading || success}
                className="w-full sm:w-28 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
              >
                Disconnect
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || success}
              className="w-full sm:w-24 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || success || !username.trim()}
              className="w-full sm:w-32 text-xs bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg flex items-center justify-center gap-1.5"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              {loading ? 'Validating...' : 'Connect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
