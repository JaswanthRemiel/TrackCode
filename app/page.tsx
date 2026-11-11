import rawProblems from '@/public/problems.json';
import { Landing, type FeaturedProblem } from '@/components/landing/Landing';

interface RawProblem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  company: string[];
}

const problems = rawProblems as unknown as RawProblem[];
const FEATURED_ID = 'trapping-rain-water';
const SHOW_FIRST = ['Amazon', 'Google', 'Meta', 'Bloomberg', 'Microsoft'];

/** Real data for the problem shown in the hero's product window. */
function featured(): FeaturedProblem {
  const p = problems.find(x => x.id === FEATURED_ID) ?? problems[0];
  const shown = SHOW_FIRST.filter(c => p.company.includes(c));
  return { id: p.id, title: p.title, difficulty: p.difficulty, tags: p.tags, companies: shown, moreCompanies: p.company.length - shown.length };
}

// Computed on the server so the landing page never ships the full 700 KB dataset.
export default function Home() {
  return (
    <Landing
      featured={featured()}
      totalProblems={problems.length}
      totalCompanies={new Set(problems.flatMap(p => p.company)).size}
    />
  );
}
