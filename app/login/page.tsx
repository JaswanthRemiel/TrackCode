'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-none overflow-hidden">
          <CardHeader className="space-y-2 flex flex-col items-center pt-8 pb-4 text-center">
            <Link href="/" className="mb-2 text-zinc-900 dark:text-zinc-50" aria-label="TrackCode home">
              <Logo size={28} />
            </Link>
            <CardTitle className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Welcome back</CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 pl-9 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-105"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Password</Label>
                  <Link href="/forgot-password" className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-50 hover:underline transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pl-9 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-105"
                  />
                </div>
              </div>
              <Button className="w-full h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-none font-semibold text-sm flex items-center justify-center gap-1.5 mt-2" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : (
                  <>
                    Sign In
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center pb-6 pt-2">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-zinc-900 dark:text-zinc-50 hover:underline font-bold transition-colors">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
