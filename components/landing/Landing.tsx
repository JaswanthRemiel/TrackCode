'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';

export interface FeaturedProblem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  companies: string[];
  moreCompanies: number;
}

const DIFF = {
  EASY: { label: 'Easy', cls: 'text-[#7EE2A8]' },
  MEDIUM: { label: 'Medium', cls: 'text-[#E3B341]' },
  HARD: { label: 'Hard', cls: 'text-[#F47067]' },
} as const;

const FAQ = [
  {
    q: 'What does Remiel actually do?',
    a: 'Two things. It builds a day-by-day study plan from problems that exist on TrackCode, and it sits next to every problem to help when you get stuck. It starts with a nudge and only writes code when you ask.',
  },
  {
    q: 'Which AI providers work?',
    a: 'OpenAI, Anthropic Claude, Google Gemini, and any OpenAI-compatible API such as OpenRouter, Groq or DeepSeek. You pick the model.',
  },
  {
    q: 'Where does my API key go?',
    a: 'It is saved in your browser and sent with each request straight to your provider. We never store it.',
  },
  {
    q: 'Can I ask it about anything?',
    a: 'No, on purpose. Remiel sticks to data structures, algorithms, interview prep and the problems on this site.',
  },
  {
    q: 'What does it cost?',
    a: 'TrackCode is free. Remiel runs on your own key, so you pay your provider for what you use, which is usually cents.',
  },
];

const PLAN = [
  { day: 'Mon', theme: 'Arrays and hashing', items: ['Two Sum', 'Group Anagrams', 'Top K Frequent Elements'] },
  { day: 'Tue', theme: 'Two pointers', items: ['Valid Palindrome', '3Sum', 'Container With Most Water'] },
  { day: 'Wed', theme: 'Sliding window', items: ['Longest Substring Without Repeating Characters', 'Permutation in String', 'Minimum Window Substring'] },
  { day: 'Thu', theme: 'Stacks', items: ['Valid Parentheses', 'Min Stack', 'Daily Temperatures'] },
];

/* ------------------------------------------------------------------ */

function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/** Rises in once it enters the viewport. */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref} data-in={inView} className={`tc-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Landing({ featured, totalProblems, totalCompanies }: { featured: FeaturedProblem; totalProblems: number; totalCompanies: number }) {
  const { userData } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cta = userData ? { href: '/dashboard', label: 'Open dashboard' } : { href: '/signup', label: 'Start free' };

  return (
    <div className="tc-land dark relative min-h-screen overflow-x-clip font-[family-name:var(--font-geist-sans)] [&_:is(h1,h2,h3)]:font-[family-name:var(--font-brand)]">
      <div aria-hidden className="tc-grain pointer-events-none fixed inset-0 z-[60]" />

      {/* Nav */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-200 ${scrolled ? 'border-b border-[var(--line)] bg-[var(--canvas)]/85 backdrop-blur-md' : 'border-b border-transparent'}`}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="TrackCode home">
            <Logo size={22} animated />
          </Link>
          <div className="hidden items-center gap-8 text-[13.5px] text-[var(--ink-soft)] md:flex">
            <a href="#coach" className="tc-link">How Remiel helps</a>
            <a href="#plan" className="tc-link">Planner</a>
            <a href="#faq" className="tc-link">FAQ</a>
          </div>
          <div className="flex items-center gap-1">
            {!userData && (
              <Link href="/login" className="tc-link hidden h-9 items-center px-3 text-[13.5px] text-[var(--ink-soft)] sm:inline-flex">
                Log in
              </Link>
            )}
            <Link href={cta.href} className="tc-btn tc-btn-primary h-9 px-4 text-[13.5px]">
              {cta.label}
            </Link>
          </div>
        </nav>
      </header>

      <Hero featured={featured} cta={cta} problemsLabel={totalProblems.toLocaleString('en-US')} />

      <HintLadder />

      <PlanSection totalCompanies={totalCompanies} />

      {/* Providers */}
      <section className="mx-auto max-w-6xl px-5 py-[clamp(5rem,12vw,9rem)] sm:px-8">
        <Reveal>
          <p className="max-w-[26ch] text-balance font-[family-name:var(--font-brand)] text-[clamp(1.75rem,3.6vw,3rem)] font-medium leading-[1.12] tracking-[-0.025em] text-[var(--ink-faint)]">
            Bring your own key. <span className="text-[var(--ink)]">OpenAI, Claude, Gemini</span>, or anything{' '}
            <span className="text-[var(--ink)]">OpenAI-compatible</span>. It never leaves your browser except to reach your provider.
          </p>
        </Reveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-5 pb-[clamp(5rem,12vw,9rem)] sm:px-8 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.035em]">Questions</h2>
        </Reveal>
        <div className="border-t border-[var(--line)]">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 50}>
              <details className="group border-b border-[var(--line)] [&_summary::-webkit-details-marker]:hidden">
                <summary className="tc-focus flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16px] font-medium">
                  {f.q}
                  <span aria-hidden className="relative h-3 w-3 shrink-0 text-[var(--ink-soft)]">
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
                    <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-200 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-6 text-[15px] leading-[1.65] text-[var(--ink-soft)]">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Ending */}
      <section className="relative border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 py-[clamp(5rem,12vw,8rem)] sm:px-8 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <h2 className="max-w-[16ch] text-balance text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.04em]">
              Pick a company. Solve one problem today.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <Link href={cta.href} className="tc-btn tc-btn-primary h-12 gap-2 px-6 text-[15px]">
              {cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-[13px] text-[var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="flex items-center gap-2.5">
            <LogoMark size={16} />© {new Date().getFullYear()} TrackCode
          </span>
          <div className="flex gap-6">
            <a href="#faq" className="tc-link">FAQ</a>
            <a href="https://github.com/JaswanthRemiel/TrackCode" target="_blank" rel="noopener noreferrer" className="tc-link">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero: centered headline, then the product window. It sits tilted back and
   settles flat as you scroll, while a Remiel exchange plays out inside it. */

function Hero({ featured, cta, problemsLabel }: { featured: FeaturedProblem; cta: { href: string; label: string }; problemsLabel: string }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.55)));
      el.style.setProperty('--tilt', String(1 - p));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section className="relative isolate px-5 pt-32 sm:px-8 sm:pt-40">
      <div aria-hidden className="tc-hero-light pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px]" />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <a
          href="#coach"
          className="tc-hero-in group mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1 pl-1 pr-3 text-[13px] text-[var(--ink-soft)] transition-colors duration-150 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
        >
          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--canvas)]">New</span>
          Meet Remiel, your AI DSA coach
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </a>

        <h1 className="tc-hero-in text-balance text-[clamp(2.75rem,7.6vw,6rem)] font-semibold leading-[0.98] tracking-[-0.045em] [animation-delay:60ms]">
          Know what to solve.
          <br />
          <span className="text-[var(--ink-faint)]">Before they ask.</span>
        </h1>

        <p className="tc-hero-in mt-7 max-w-[44ch] text-pretty text-[17px] leading-[1.6] text-[var(--ink-soft)] [animation-delay:120ms] sm:text-[18px]">
          {problemsLabel} LeetCode problems sorted by the companies that ask them, and a coach that gives hints before answers.
        </p>

        <div className="tc-hero-in mt-9 flex w-full flex-col items-center gap-3 [animation-delay:180ms] sm:w-auto sm:flex-row">
          <Link href={cta.href} className="tc-btn tc-btn-primary h-12 w-full gap-2 px-6 text-[15px] sm:w-auto">
            {cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#coach" className="tc-btn h-12 w-full border border-[var(--line-strong)] px-6 text-[15px] text-[var(--ink)] hover:bg-white/[0.04] sm:w-auto">
            See Remiel in action
          </a>
        </div>
        <p className="tc-hero-in mt-4 text-[13px] text-[var(--ink-faint)] [animation-delay:220ms]">Free. Bring your own OpenAI, Claude or Gemini key.</p>
      </div>

      {/* Product window */}
      <div ref={stageRef} className="tc-stage mx-auto mt-16 max-w-5xl sm:mt-20">
        <div className="tc-hero-in tc-window [animation-delay:280ms]">
          <div className="flex h-10 items-center gap-1.5 border-b border-[var(--line)] px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="mx-auto hidden truncate rounded-md bg-white/[0.04] px-3 py-0.5 font-mono text-[11px] text-[var(--ink-faint)] sm:block">
              trackcode / problems / {featured.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_23rem]">
            {/* Problem side */}
            <div className="space-y-5 p-6 text-left sm:p-8">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-[5px] bg-white/[0.05] px-1.5 py-0.5 text-[11px] font-medium ${DIFF[featured.difficulty].cls}`}>{DIFF[featured.difficulty].label}</span>
                {featured.tags.map(t => (
                  <span key={t} className="rounded-[5px] border border-[var(--line)] px-1.5 py-0.5 text-[11px] text-[var(--ink-soft)]">{t}</span>
                ))}
              </div>
              <h2 className="text-balance text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-[1.1] tracking-[-0.03em]">{featured.title}</h2>
              <div className="flex flex-wrap gap-1.5">
                {featured.companies.map(c => (
                  <span key={c} className="rounded-[5px] bg-white/[0.05] px-2 py-1 text-[11.5px] text-[var(--ink-soft)]">{c}</span>
                ))}
                {featured.moreCompanies > 0 && <span className="px-1 py-1 text-[11.5px] text-[var(--ink-faint)]">+{featured.moreCompanies} more</span>}
              </div>
              <div className="space-y-2 pt-1" aria-hidden>
                <div className="h-2 w-11/12 rounded bg-white/[0.05]" />
                <div className="h-2 w-9/12 rounded bg-white/[0.05]" />
                <div className="h-2 w-10/12 rounded bg-white/[0.05]" />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="tc-done inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-semibold">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} /> Done
                </span>
                <span className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[var(--line)] px-3 text-[12.5px] text-[var(--ink-soft)]">
                  Solve on LeetCode <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {/* Remiel panel */}
            <div className="border-t border-[var(--line)] p-4 md:border-l md:border-t-0">
              <div className="tc-float tc-chat rounded-[12px] p-4">
                <div className="flex items-center gap-2.5 border-b border-[var(--line)] pb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[var(--mark-tile)] ring-1 ring-[var(--line)]">
                    <LogoMark size={15} />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-[13px] font-semibold leading-none">Remiel</p>
                    <p className="mt-1 truncate text-[11px] text-[var(--ink-faint)]">Focused on {featured.title}</p>
                  </div>
                </div>
                <div className="space-y-3 py-3 text-left text-[13px] leading-[1.5]">
                  <p className="tc-seq ml-auto w-fit max-w-[90%] rounded-[10px] bg-[var(--ink)] px-3 py-1.5 text-[var(--canvas)]" style={{ ['--d' as string]: '900ms' }}>
                    Give me a hint, no code
                  </p>
                  <p className="tc-seq text-[var(--ink-soft)]" style={{ ['--d' as string]: '1700ms' }}>
                    <span className="font-semibold text-[var(--ink)]">Hint 1.</span> The water above a bar depends on the tallest bar to its left and to its right.
                  </p>
                  <p className="tc-seq text-[var(--ink-soft)]" style={{ ['--d' as string]: '2500ms' }}>
                    <span className="font-semibold text-[var(--ink)]">Hint 2.</span> Two pointers can track both maximums in a single pass.
                  </p>
                  <p className="tc-seq text-[var(--ink-faint)]" style={{ ['--d' as string]: '3200ms' }}>Target: O(n) time, O(1) space.</p>
                </div>
                <div className="flex items-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2">
                  <span className="flex-1 truncate text-left text-[12px] text-[var(--ink-faint)]">
                    Why move the shorter side?<span className="tc-caret ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-[var(--ink-soft)]" />
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[var(--accent)] text-[var(--canvas)]">
                    <ArrowUpRight className="h-3.5 w-3.5 -rotate-45" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The peak: scrolling walks down Remiel's hint ladder, one rung at a time. */

const RUNGS = [
  { label: 'Nudge', body: 'You only care whether the current window has a repeat. What can answer that in constant time?' },
  { label: 'Pattern', body: 'Sliding window. Grow the right edge every step, and move the left edge only when a character repeats.' },
  { label: 'Outline', body: "Keep each character's last index. On a repeat, jump left to max(left, last + 1). O(n) time, O(k) space." },
  { label: 'Code', body: 'Only when you ask for it.' },
];

function HintLadder() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(-1);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;

    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (!desktop.matches || reduced.matches) {
        // Unpinned: rungs light up as the section passes through the screen.
        const p = (vh * 0.75 - r.top) / Math.max(r.height, 1);
        setStep(Math.min(RUNGS.length - 1, Math.floor(p * (RUNGS.length + 0.5))));
        return;
      }
      const p = Math.min(1, Math.max(0, -r.top / Math.max(r.height - vh, 1)));
      setStep(p < 0.04 ? -1 : Math.min(RUNGS.length - 1, Math.floor(p * RUNGS.length * 1.15)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const onMedia = () => {
      setPinned(desktop.matches && !reduced.matches);
      measure();
    };

    onMedia();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    desktop.addEventListener('change', onMedia);
    reduced.addEventListener('change', onMedia);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      desktop.removeEventListener('change', onMedia);
      reduced.removeEventListener('change', onMedia);
    };
  }, []);

  return (
    <section id="coach" ref={ref} className={`relative scroll-mt-16 border-t border-[var(--line)] ${pinned ? 'h-[260vh]' : ''}`}>
      <div className={pinned ? 'sticky top-0 flex h-svh items-center' : 'py-24'}>
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="lg:pt-2">
            <h2 className="max-w-[12ch] text-balance text-[clamp(2.25rem,4.6vw,3.75rem)] font-semibold leading-[1] tracking-[-0.04em]">
              Hints first. Code when you ask.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[16px] leading-[1.65] text-[var(--ink-soft)]">
              Open any problem and Remiel already knows which one you are on, how far you got, and what you wrote in your notes. It will not wander off topic, and it will not spoil the answer unless you want it to.
            </p>
          </div>

          <div>
            <div className="mb-8">
              <span className="rounded-[7px] border border-[var(--line)] px-2 py-1 font-mono text-[11.5px] text-[var(--ink-soft)]">longest-substring-without-repeating-characters</span>
            </div>
            <p className="mb-8 ml-auto w-fit max-w-[85%] rounded-[12px] bg-[var(--ink)] px-4 py-2.5 text-[15px] text-[var(--canvas)]">
              I keep getting the wrong length on &quot;abba&quot;. Hint please, no code.
            </p>

            <ol className="relative">
              <span aria-hidden className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--line)]" />
              <span
                aria-hidden
                className="absolute left-[7px] top-2 w-px origin-top bg-[var(--accent)] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ height: 'calc(100% - 1rem)', transform: `scaleY(${Math.max(0, step) / (RUNGS.length - 1)})` }}
              />
              {RUNGS.map((r, i) => {
                const on = i <= step;
                return (
                  <li key={r.label} data-on={on} className="tc-rung relative pb-7 pl-9 last:pb-0">
                    <span
                      aria-hidden
                      className={`absolute left-0 top-[5px] h-[15px] w-[15px] rounded-[4px] border transition-colors duration-300 ${on ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--line-strong)] bg-[var(--canvas)]'}`}
                    />
                    <p className="text-[13px] font-medium text-[var(--ink-faint)]">{r.label}</p>
                    <p className="mt-1 max-w-[52ch] text-[16.5px] leading-[1.55]">{r.body}</p>
                    {i === RUNGS.length - 1 && (
                      <pre className="tc-code mt-4 overflow-x-auto rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 font-mono text-[12.5px] leading-[1.7] text-[var(--ink-soft)]">
{`def length_of_longest_substring(s):
    last, left, best = {}, 0, 0
    for right, ch in enumerate(s):
        if last.get(ch, -1) >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best`}
                      </pre>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function PlanSection({ totalCompanies }: { totalCompanies: number }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.35);

  return (
    <section id="plan" className="scroll-mt-16 border-t border-[var(--line)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-[clamp(5rem,12vw,9rem)] sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <h2 className="max-w-[13ch] text-balance text-[clamp(2.25rem,4.6vw,3.75rem)] font-semibold leading-[1] tracking-[-0.04em]">
            A plan made of real problems.
          </h2>
          <p className="mt-6 max-w-[40ch] text-[16px] leading-[1.65] text-[var(--ink-soft)]">
            Choose one of {totalCompanies} companies, how many days you have, and what you are weak at. Remiel arranges problems you have not solved yet into daily themes, and each day ticks itself off as you mark problems done.
          </p>
        </Reveal>

        <div ref={ref} data-in={inView} className="border-t border-[var(--line)]">
          {PLAN.map((d, di) => (
            <div key={d.day} className="grid grid-cols-[3.25rem_1fr] gap-4 border-b border-[var(--line)] py-5 sm:grid-cols-[4rem_1fr]">
              <span className="pt-0.5 font-mono text-[12.5px] text-[var(--ink-faint)]">{d.day}</span>
              <div>
                <p className="text-[15px] font-medium">{d.theme}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {d.items.map((t, ti) => {
                    const done = di === 0 || (di === 1 && ti === 0);
                    return (
                      <li key={t} className="flex items-center gap-2.5 text-[14.5px] text-[var(--ink-soft)]">
                        <span
                          className={`tc-check flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${done ? 'border-transparent' : 'border-[var(--line-strong)]'}`}
                          data-done={done}
                          style={{ transitionDelay: `${(di * 3 + ti) * 70 + 200}ms` }}
                        >
                          {done && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className={done ? 'tc-strike' : ''} style={{ transitionDelay: `${(di * 3 + ti) * 70 + 260}ms` }}>
                          {t}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
          <p className="pt-4 text-[12.5px] text-[var(--ink-faint)]">Example week for a 14-day plan. Your plan uses your own progress.</p>
        </div>
      </div>
    </section>
  );
}
