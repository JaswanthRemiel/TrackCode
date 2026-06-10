'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Flame, CheckCircle, Mail, Hash } from 'lucide-react';

export default function ProfilePage() {
  const { userData } = useAuth();
  const router = useRouter();

  if (!userData) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const memberSince = new Date(userData.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Hero */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-3xl font-black uppercase shadow-2xl shadow-primary/20">
          {userData.email ? userData.email[0] : 'U'}
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-serif">{userData.email}</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Member since {memberSince}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 md:p-6 border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 text-center card-glow transition-colors duration-300">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl md:text-3xl font-serif font-black">{userData.totalSolved}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Solved</p>
          </div>
        </Card>
        <Card className="p-4 md:p-6 border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 text-center card-glow transition-colors duration-300">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
              <Flame className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl md:text-3xl font-serif font-black">{userData.currentStreak}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Streak</p>
          </div>
        </Card>
        <Card className="p-4 md:p-6 border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 text-center card-glow transition-colors duration-300">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl md:text-3xl font-serif font-black">{userData.longestStreak}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Best</p>
          </div>
        </Card>
      </div>

      {/* Account Details */}
      <Card className="border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 overflow-hidden card-glow transition-colors duration-300">
        <CardContent className="p-0">
          <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5">
            <h2 className="text-xl font-serif">Account Details</h2>
          </div>
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            <div className="flex items-center gap-4 p-5 md:p-6">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Email</p>
                <p className="text-sm font-medium truncate">{userData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 md:p-6">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">User ID</p>
                <p className="text-sm font-medium font-mono text-slate-500 dark:text-slate-400">{userData.uid.slice(0, 12)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 md:p-6">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Joined</p>
                <p className="text-sm font-medium">{new Date(userData.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-100 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 overflow-hidden transition-colors duration-300">
        <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-rose-900 dark:text-rose-300">Sign Out</h3>
            <p className="text-sm text-rose-400 dark:text-rose-400/70">End your current session and return to the login page.</p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="rounded-xl px-6 font-bold flex items-center gap-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
