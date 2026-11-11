import 'server-only';
import rawProblems from '@/public/problems.json';

export interface ServerProblem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  leetcodeUrl: string;
  tags: string[];
  company: string[];
}

const problems = rawProblems as unknown as ServerProblem[];
const byId = new Map(problems.map(p => [p.id, p]));

export function getAllProblems(): ServerProblem[] {
  return problems;
}

export function getProblem(id: string | null | undefined): ServerProblem | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

export function hasProblem(id: string): boolean {
  return byId.has(id);
}

/** Problems from our dataset that share the most tags with the given problem. */
export function relatedProblems(p: ServerProblem, limit = 8): ServerProblem[] {
  const tags = new Set(p.tags);
  return problems
    .filter(o => o.id !== p.id)
    .map(o => ({ o, score: o.tags.filter(t => tags.has(t)).length }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || b.o.company.length - a.o.company.length)
    .slice(0, limit)
    .map(x => x.o);
}
