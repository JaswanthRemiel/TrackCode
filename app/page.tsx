'use client';

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, GitCommit, LayoutDashboard, Target, TrendingUp, ArrowRight, Zap, Globe, Shield } from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const { userData } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-16 overflow-hidden">
        <section className="container mx-auto px-4 sm:px-6 relative flex flex-col items-center">
          <div className="absolute top-20 -left-20 w-40 h-40 md:w-72 md:h-72 bg-accent/5 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-40 -right-20 w-52 h-52 md:w-96 md:h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />

          <div className="flex flex-col items-center text-center max-w-4xl space-y-8 md:space-y-10 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="glass px-4 py-1.5 rounded-full flex items-center gap-2 border-white/40 shadow-xl shadow-black/5 animate-bounce-slow">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] md:text-xs font-bold tracking-tight uppercase">Trusted by 470+ Software Engineers</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif leading-[0.9] text-balance">
                Master the interview. <br />
                <span className="text-muted-foreground italic">Track every detail.</span>
              </h1>
              <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto font-medium px-4">
                TrackCode provides a focused, minimal environment to track your LeetCode journey across top tech companies. Monitor your streaks and build your profile.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-6 sm:px-0">
              {userData ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="sm" className="h-12 md:h-14 w-full sm:px-10 text-base md:text-lg font-bold shadow-2xl text-white">Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" /></Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="sm" className="h-12 md:h-14 w-full sm:px-10 text-base md:text-lg font-bold shadow-2xl text-white shadow-accent/20">Start Tracking <ArrowRight className="ml-2 w-5 h-5" /></Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="ghost" size="lg" className="h-12 md:h-14 w-full sm:px-10 text-base md:text-lg font-bold text-slate-400">Login to account</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="w-full max-w-5xl mx-auto mt-6 md:mt-10 rounded-2xl md:rounded-3xl border border-black/5 bg-white shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent pointer-events-none" />
            <div className="h-9 w-full bg-slate-50 border-b flex items-center px-4 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            </div>
            <div className="p-8 md:p-12 space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                  <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-24 bg-slate-100 rounded-full" />
                  <div className="h-10 w-10 bg-primary rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-slate-50 border border-black/5 rounded-2xl p-4 space-y-2">
                    <div className="h-3 w-3/4 bg-slate-200 rounded" />
                    <div className="h-6 w-1/2 bg-slate-300 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {}
        <section className="container mx-auto px-6 py-32 space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <h2 className="text-4xl md:text-6xl font-serif leading-none">Designed for <br /><span className="italic text-muted-foreground">High Performers.</span></h2>
              <p className="text-lg text-slate-500">Forget spreadsheets. TrackCode is the elite workspace for your technical interview preparation.</p>
            </div>
            <Button variant="outline" className="h-12 border-black/10">Browse Features</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Company Lists"
              description="Curated lists for Google, Amazon, and 470+ others, pulled from top repositories."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Real-time Streaks"
              description="Visual consistency metrics to keep your momentum high throughout the preparation."
            />
            <FeatureCard
              icon={<GitCommit className="w-6 h-6" />}
              title="Contribution Graph"
              description="Beautiful heatmap visualization of your problem-solving frequency."
            />
          </div>
        </section>

        {}
        <section className="container mx-auto px-4 sm:px-6 py-20">
          <div className="bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-24 text-center text-white space-y-6 md:space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50" />
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-serif leading-none relative z-10">Ready to break into <br />Big Tech?</h2>
            <div className="flex justify-center relative z-10">
              <Link href="/signup" className="w-full sm:w-auto px-4">
                <Button size="lg" className="h-14 md:h-16 w-full sm:px-12 text-lg md:text-xl font-bold bg-white text-primary hover:bg-slate-100 rounded-full">Sign up for Free</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-6 py-8 md:py-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center space-x-2 font-serif text-lg">
          <span className="font-bold tracking-tighter text-slate-900">TrackCode</span>
        </div>
        <p className="text-xs md:text-sm text-slate-500 font-medium text-center md:text-left">© 2024 TrackCode Intelligence. All rights reserved.</p>
        <div className="flex gap-6 md:gap-8 text-xs md:text-sm font-bold text-slate-400">
          <Link href="#">Terms</Link>
          <Link href="#">Privacy</Link>
          <Link href="#">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white border border-black/5 p-10 rounded-[2rem] space-y-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-white transition-colors duration-500">
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-serif">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
