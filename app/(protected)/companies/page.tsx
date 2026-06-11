'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState, useMemo, useDeferredValue } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useData } from "@/components/data/DataProvider";
import { ArrowUpRight, Search } from "lucide-react";

const POPULAR_COMPANIES = [
  "Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix",
  "Uber", "Airbnb", "LinkedIn", "Twitter", "Bloomberg"
];

export default function CompaniesPage() {
  const { userData } = useAuth();
  const { problems, userProgress, loading } = useData();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const companies = useMemo(() => {
    if (problems.length === 0) {
      return POPULAR_COMPANIES.map(c => ({ 
        name: c, 
        total: Math.floor(Math.random() * 50) + 10, 
        solved: 0 
      }));
    }

    const solvedProblemIds = new Set(
      Object.values(userProgress)
        .filter(p => p.status === 'done')
        .map(p => p.problemId)
    );

    const compMap = new Map<string, { total: number, solved: number }>();
    problems.forEach(p => {
      const comps = Array.isArray(p.company) ? p.company : [p.company];
      const isSolved = solvedProblemIds.has(p.id);
      
      comps.forEach((c: string) => {
        if (c) {
          const existing = compMap.get(c) || { total: 0, solved: 0 };
          existing.total += 1;
          if (isSolved) existing.solved += 1;
          compMap.set(c, existing);
        }
      });
    });

    return Array.from(compMap.entries()).map(([name, counts]) => ({
      name,
      total: counts.total,
      solved: counts.solved
    })).sort((a, b) => b.total - a.total);
  }, [problems, userProgress]);

  const filtered = useMemo(() => {
    return companies.filter(c => c.name.toLowerCase().includes(deferredSearch.toLowerCase()));
  }, [companies, deferredSearch]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Companies</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Targeted lists from 470+ organizations.</p>
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <Input 
            placeholder="Search companies..." 
            className="pl-9 h-10 rounded-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-48 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-400 dark:text-zinc-500 italic text-lg">No companies in sight.</div>
        ) : (
          filtered.map((company) => {
            const percent = company.total > 0 ? (company.solved / company.total) * 100 : 0;
            const isCompleted = company.solved === company.total && company.total > 0;
            const isNotStarted = company.solved === 0;
            const isInProgress = !isCompleted && !isNotStarted;

            return (
              <Link key={company.name} href={`/companies/${encodeURIComponent(company.name)}`}>
                <Card className="group h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 shadow-none transition-colors duration-200 p-6 flex flex-col justify-between min-h-[200px] rounded-xl">
                  
                  {/* Top Row: Company Name and Checkbox */}
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 capitalize">
                      {company.name}
                    </CardTitle>
                    <div className="w-4 h-4 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0" />
                  </div>

                  {/* Middle Row: Progress info */}
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      <span>Progress</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">{company.solved} / {company.total}</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500 ease-out rounded-full" 
                        style={{ width: `${percent}%` }} 
                      />
                    </div>
                  </div>

                  {/* Bottom Row: Status Badge */}
                  <div className="mt-5 flex justify-between items-center">
                    {isCompleted ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-255/20 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 border border-amber-255/20 dark:border-amber-900/30 text-amber-700 dark:text-amber-400">
                        In progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                        Not started
                      </span>
                    )}
                    <ArrowUpRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors" />
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
