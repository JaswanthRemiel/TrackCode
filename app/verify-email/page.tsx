'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dock } from '@/components/dock';
import { Mail, RefreshCw, Send, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.emailVerified) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleCheckStatus = async () => {
    if (!auth.currentUser) return;
    setError('');
    setMessage('');
    setIsChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        // Force full page navigation to refresh AuthContext
        window.location.href = '/dashboard';
      } else {
        setError("We couldn't confirm your verification yet. Please click the link in your email and try again.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check verification status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!auth.currentUser || cooldown > 0) return;
    setError('');
    setMessage('');
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('A fresh verification link has been sent to your email.');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification link');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err: any) {
      setError('Failed to sign out');
    }
  };

  if (loading || !user || user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-slate-500 font-medium italic">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Dock />

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        <Card className="border-black/5 dark:border-white/5 shadow-2xl shadow-black/[0.05] dark:shadow-black/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm overflow-hidden transition-colors duration-300">
          <CardHeader className="space-y-3 flex flex-col items-center pt-10 pb-2 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
              <Mail className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-serif">Verify your email</CardTitle>
            <CardDescription className="px-4 text-slate-500 dark:text-slate-400">
              We sent a verification link to <span className="font-bold text-slate-900 dark:text-white">{user.email}</span>. Click the link to secure your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 py-6 space-y-4">
            {error && (
              <div className="p-4 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl font-medium flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-4 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl font-medium flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl text-white font-bold shadow-xl shadow-primary/10 flex items-center justify-center gap-2"
              onClick={handleCheckStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking status...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Verify Status & Proceed
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-bold border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-center gap-2"
              onClick={handleResendEmail}
              disabled={cooldown > 0}
            >
              <Send className="w-4 h-4" />
              {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Verification Email'}
            </Button>
          </CardContent>

          <CardFooter className="flex justify-center pb-8 pt-2">
            <button
              onClick={handleSignOut}
              className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sign out / Change account
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
