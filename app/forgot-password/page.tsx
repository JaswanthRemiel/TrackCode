'use client';

import { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Dock } from '@/components/dock';
import { ArrowLeft, KeyRound, RefreshCw, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('A password reset link has been sent to your email address.');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Dock />

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        <Card className="border-black/5 dark:border-white/5 shadow-2xl shadow-black/[0.05] dark:shadow-black/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm overflow-hidden transition-colors duration-300">
          <CardHeader className="space-y-3 flex flex-col items-center pt-10 pb-2 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-serif">Forgot Password</CardTitle>
            <CardDescription className="px-4 text-slate-500 dark:text-slate-400">
              Enter your email address and we will send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 py-4">
            <form onSubmit={handleResetPassword} className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50/50 dark:bg-white/5 border-black/5 dark:border-white/5"
                />
              </div>

              <Button
                className="w-full h-12 rounded-xl text-white font-bold shadow-xl shadow-primary/10 flex items-center justify-center gap-2"
                type="submit"
                disabled={loading || cooldown > 0}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : cooldown > 0 ? (
                  `Resend link in ${cooldown}s`
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center pb-8 pt-2">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
