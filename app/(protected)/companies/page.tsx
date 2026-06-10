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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-balance">Companies</h1>
          <p className="text-muted-foreground text-sm">Targeted lists from 470+ organizations</p>
        </div>
        <div className="w-full sm:max-w-xs">
          <Input 
            placeholder="Search companies..." 
            className="h-11 rounded-xl bg-secondary border-border focus:ring-2 focus:ring-accent focus:ring-offset-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-elevated h-40 animate-pulse bg-muted" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <p className="text-muted-foreground text-sm">No companies found</p>
          </div>
        ) : (
          filtered.map((company) => {
            const percentage = Math.min(100, Math.max(0, (company.solved / company.total) * 100));
            
            return (
              <Link key={company.name} href={`/companies/${encodeURIComponent(company.name)}`}>
                <div className="card-interactive group p-6 space-y-4 h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold capitalize group-hover:text-accent transition-colors duration-300">
                      {company.name}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</span>
                      <span className="badge-accent">{company.solved} / {company.total}</span>
                    </div>
                    
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
