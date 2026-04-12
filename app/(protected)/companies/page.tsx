'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useData } from "@/components/data/DataProvider";


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
    <div className="space-y-6 md:space-y-10 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-serif">Companies.</h1>
          <p className="text-slate-500 font-medium italic">Targeted lists from 470+ organizations.</p>
        </div>
        <div className="w-full md:max-w-sm">
          <Input 
            placeholder="Search companies..." 
            className="h-11 md:h-12 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-40 border-black/5 bg-slate-50/50" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 italic font-serif text-2xl">No companies in sight.</div>
        ) : (
          filtered.map((company) => (
            <Link key={company.name} href={`/companies/${encodeURIComponent(company.name)}`}>
              <Card className="hover:border-accent transition-all duration-500 cursor-pointer h-full group bg-white border-black/5 shadow-xl shadow-black/[0.02] hover:-translate-y-1">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-serif transition-colors group-hover:text-accent capitalize">{company.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      <span>Efficiency</span>
                      <span className="text-primary">{company.solved} / {company.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary group-hover:bg-accent transition-colors duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, (company.solved / company.total) * 100))}%` }} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
