'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, Send, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-zinc-900 dark:text-zinc-50 animate-spin" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium italic">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-none overflow-hidden">
          <CardHeader className="space-y-2 flex flex-col items-center pt-8 pb-2 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-50 mb-2">
              <Mail className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Verify your email</CardTitle>
            <CardDescription className="px-4 text-xs text-zinc-500 dark:text-zinc-400">
              We sent a verification link to <span className="font-semibold text-zinc-900 dark:text-zinc-50">{user.email}</span>. Click the link to secure your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-4 space-y-3">
            {error && (
              <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <Button
              className="w-full h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-none font-semibold text-sm flex items-center justify-center gap-1.5"
              onClick={handleCheckStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Checking status...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Verify Status & Proceed
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full h-10 rounded-lg font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center gap-1.5"
              onClick={handleResendEmail}
              disabled={cooldown > 0}
            >
              <Send className="w-3.5 h-3.5" />
              {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Verification Email'}
            </Button>
          </CardContent>

          <CardFooter className="flex justify-center pb-6 pt-2">
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-zinc-400 hover:text-rose-500 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out / Change account
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
