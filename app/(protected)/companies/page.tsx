'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useData } from "@/components/data/DataProvider";
import { ArrowUpRight } from "lucide-react";

const POPULAR_COMPANIES = [
  "Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix",
  "Uber", "Airbnb", "LinkedIn", "Twitter", "Bloomberg"
];

export default function CompaniesPage() {
  const { userData } = useAuth();
  const { problems, userProgress, loading } = useData();
  const [search, setSearch] = useState("");

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

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-serif">Companies.</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">Targeted lists from 470+ organizations.</p>
        </div>
        <div className="w-full md:max-w-sm">
          <Input 
            placeholder="Search companies..." 
            className="h-11 md:h-12 rounded-xl bg-white dark:bg-card border-black/5 dark:border-white/5 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-44 border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 dark:text-slate-500 italic font-serif text-2xl">No companies in sight.</div>
        ) : (
          filtered.map((company) => {
            const percent = company.total > 0 ? (company.solved / company.total) * 100 : 0;
            return (
              <Link key={company.name} href={`/companies/${encodeURIComponent(company.name)}`}>
                <Card className="group h-full bg-white dark:bg-card border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 hover:-translate-y-1.5 transition-all duration-500 card-glow overflow-hidden relative">
                  {/* Accent line on hover */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  
                  <CardHeader className="p-6 md:p-8 pb-3 md:pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl md:text-2xl font-serif transition-colors group-hover:text-accent capitalize">{company.name}</CardTitle>
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                        <ArrowUpRight className="w-4 h-4 text-accent" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 pt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <span>Efficiency</span>
                        <span className="text-primary font-black">{company.solved} / {company.total}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary group-hover:bg-accent transition-all duration-700 ease-out rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(2, percent))}%` }} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
