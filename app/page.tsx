'use client';

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Target, TrendingUp, GitCommit, ArrowRight } from "lucide-react";

export default function Home() {
  const { userData } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="pb-28">

        {/* Hero */}
        <section className="container mx-auto px-4 sm:px-6 pt-16 flex flex-col items-center">
          <div className="flex flex-col items-center text-center max-w-4xl space-y-8 md:space-y-10 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] md:text-xs font-semibold tracking-tight text-zinc-600 dark:text-zinc-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span>470+ engineers preparing smarter</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-none text-balance text-zinc-900 dark:text-zinc-50">
                Track your grind,<br />
                <span className="text-zinc-400 dark:text-zinc-500">company by company.</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto font-medium px-4 leading-relaxed">
                Stop using spreadsheets. TrackCode organises your LeetCode practice by company — with streaks and a contribution graph to keep you consistent.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto px-6 sm:px-0">
              {userData ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="h-11 w-full sm:px-8 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-none">
                    Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button className="h-11 w-full sm:px-8 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-none">
                      Start for free <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="ghost" className="h-11 w-full sm:px-8 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="w-full max-w-4xl mx-auto mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-none">
            {/* Fake browser chrome */}
            <div className="h-9 w-full bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="ml-4 h-4 w-40 bg-zinc-200 dark:bg-zinc-900 rounded-full" />
            </div>
            {/* Skeleton dashboard */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-900 rounded" />
                  <div className="h-6 w-44 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
                  <div className="h-8 w-8 bg-zinc-900 dark:bg-zinc-50 rounded-full" />
                </div>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-2">
                    <div className="h-2.5 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-4 w-1/3 bg-zinc-305 dark:bg-zinc-700 rounded" />
                  </div>
                ))}
              </div>
              {/* Heatmap skeleton */}
              <div className="space-y-2">
                <div className="h-2.5 w-28 bg-zinc-100 dark:bg-zinc-900 rounded" />
                <div className="grid grid-cols-[repeat(26,_1fr)] gap-1">
                  {Array.from({ length: 182 }).map((_, i) => {
                    const pseudoRandom = ((i * 17) % 100) / 100;
                    const opacity = pseudoRandom > 0.6 ? pseudoRandom * 0.7 + 0.1 : 0.05;
                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-sm"
                        style={{
                          backgroundColor: `var(--accent)`,
                          opacity
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 py-20 space-y-12 max-w-5xl">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Everything you need. <span className="text-zinc-400 dark:text-zinc-500 font-medium">Nothing you don't.</span>
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Three focused tools that cover the full prep loop — no noise, no bloat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Target className="w-4 h-4" />}
              title="Company Lists"
              description="Curated problem sets for Google, Meta, Amazon and 470+ others — sourced from real interview reports."
            />
            <FeatureCard
              icon={<TrendingUp className="w-4 h-4" />}
              title="Streaks"
              description="Daily streak tracking that rewards consistency, not just volume. Miss a day, see exactly where."
            />
            <FeatureCard
              icon={<GitCommit className="w-4 h-4" />}
              title="Contribution Graph"
              description="A GitHub-style heatmap of every problem you've solved. Your effort, made visible."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-8 md:p-16 text-center space-y-5 rounded-xl shadow-none">
            <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">Free to use</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Start your prep today.
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              No card required. Just sign up and start marking problems done.
            </p>
            <div className="flex justify-center pt-2">
              <Link href="/signup" className="w-full sm:w-auto px-4">
                <Button className="h-11 w-full sm:px-8 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-none">
                  Create free account <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="container mx-auto px-6 py-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6 max-w-5xl">
        <span className="font-semibold tracking-tight text-sm text-zinc-900 dark:text-zinc-50">TrackCode</span>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center font-medium">
          © {new Date().getFullYear()} TrackCode. All rights reserved.
        </p>
        <div className="flex gap-6 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-50">Terms</Link>
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-50">Privacy</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-zinc-50">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-xl space-y-4 shadow-none">
      <div className="w-8 h-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-50">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{description}</p>
      </div>
    </Card>
  );
}