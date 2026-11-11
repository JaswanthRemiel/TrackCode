'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { RemielSettingsPanel } from '@/components/remiel/SettingsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { signOut, updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Flame, CheckCircle, Mail, Hash, KeyRound, AlertCircle, CheckCircle2, Lock, RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const { userData } = useAuth();
  const router = useRouter();
  
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (!userData) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (!auth.currentUser) return;
    setIsUpdatingPassword(true);

    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setPasswordError('This is a sensitive operation and requires recent authentication. Please sign out, sign back in, and try again.');
      } else {
        setPasswordError(err.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const memberSince = new Date(userData.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 md:py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Hero */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-950 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-50 dark:text-zinc-100 flex items-center justify-center text-2xl font-bold uppercase shadow-none">
          {userData.email ? userData.email[0] : 'U'}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{userData.email}</h1>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium">Member since {memberSince}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none text-center rounded-xl transition-colors duration-300">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-900 dark:text-zinc-50">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50">{userData.totalSolved}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Solved</p>
          </div>
        </Card>
        <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none text-center rounded-xl transition-colors duration-300">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-900 dark:text-zinc-50">
              <Flame className="w-4 h-4" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50">{userData.currentStreak}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Streak</p>
          </div>
        </Card>
        <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none text-center rounded-xl transition-colors duration-300">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-900 dark:text-zinc-50">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50">{userData.longestStreak}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Best</p>
          </div>
        </Card>
      </div>

      {/* Account Details */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-950 rounded-xl overflow-hidden transition-colors duration-300">
        <CardContent className="p-0">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Account Details</h2>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            <div className="flex items-center gap-4 p-5">
              <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-zinc-900 dark:text-zinc-50">
                <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Email</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{userData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5">
              <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-zinc-900 dark:text-zinc-50">
                <Hash className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">User ID</p>
                <p className="text-sm font-medium font-mono text-zinc-500 dark:text-zinc-400">{userData.uid.slice(0, 12)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5">
              <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-zinc-900 dark:text-zinc-50">
                <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Joined</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(userData.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remiel AI key */}
      <Card id="remiel-key" className="scroll-mt-8 border border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-950 rounded-xl overflow-hidden transition-colors duration-300">
        <CardContent className="p-6 md:p-8">
          <RemielSettingsPanel />
        </CardContent>
      </Card>

      {/* Security Zone */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-950 rounded-xl overflow-hidden transition-colors duration-300">
        <CardContent className="p-6 md:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Security</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Update your password to keep your account secure.</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {passwordError && (
              <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-450 dark:text-zinc-500 pointer-events-none" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 pl-9 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100"
                />
              </div>
            </div>

            <Button
              className="rounded-lg h-10 px-5 font-semibold bg-zinc-900 hover:bg-zinc-805 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 shadow-none flex items-center gap-1.5"
              type="submit"
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-rose-250/30 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10 shadow-none overflow-hidden transition-colors duration-300 rounded-xl">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-rose-900 dark:text-rose-400">Sign Out</h3>
            <p className="text-xs text-rose-500 dark:text-rose-550">End your current session and return to the login page.</p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="rounded-lg h-10 px-5 font-semibold bg-rose-600 hover:bg-rose-500 dark:bg-rose-900 dark:hover:bg-rose-800 text-white shadow-none flex items-center gap-1.5 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
