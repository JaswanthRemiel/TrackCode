'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Dock } from '@/components/dock';
import { ArrowRight } from 'lucide-react';
import { User } from '@/types';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData: User = {
        uid: user.uid,
        email: user.email || '',
        createdAt: Date.now(),
        currentStreak: 0,
        longestStreak: 0,
        totalSolved: 0,
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      await sendEmailVerification(user);
      router.push('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Dock />
      
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        <Card className="border-black/5 dark:border-white/5 shadow-2xl shadow-black/[0.05] dark:shadow-black/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm overflow-hidden transition-colors duration-300">
          <CardHeader className="space-y-3 flex flex-col items-center pt-10 pb-2">
            <Link href="/" className="flex items-center space-x-2 mb-4 group">
              <span className="font-bold text-2xl font-serif group-hover:text-accent transition-colors">TrackCode</span>
            </Link>
            <CardTitle className="text-2xl font-serif">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to get started for free
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-2">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Email</Label>
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
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50/50 dark:bg-white/5 border-black/5 dark:border-white/5"
                />
              </div>
              <Button className="w-full h-12 rounded-xl text-white font-bold shadow-xl shadow-primary/10" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : (
                  <>
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pb-8 pt-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-primary underline font-bold hover:text-accent transition-colors">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
