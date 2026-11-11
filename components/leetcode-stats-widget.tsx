'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeetCodeModal } from './leetcode-modal';
import { Lock, Settings, RefreshCw, AlertTriangle, ExternalLink, Trophy, Medal } from 'lucide-react';

interface LeetCodeStats {
  ranking: number;
  reputation: number;
  points: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalQuestions: number;
  easyQuestions: number;
  mediumQuestions: number;
  hardQuestions: number;
}

export function LeetCodeStatsWidget() {
  const { userData } = useAuth();
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const username = userData?.leetcodeUsername;

  const fetchStats = async (force = false) => {
    if (!username) return;

    const cacheKey = `lc_stats_${username}`;
    if (!force) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          setStats(JSON.parse(cached));
          setError('');
          return;
        } catch (e) {
          // Ignore cache parsing error
        }
      }
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/leetcode?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to fetch LeetCode statistics');
        setStats(null);
      } else {
        setStats(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchStats();
    } else {
      setStats(null);
      setError('');
    }
  }, [username]);

  const mockStats = {
    ranking: 154200,
    reputation: 200,
    points: 1500,
    totalSolved: 450,
    easySolved: 200,
    mediumSolved: 200,
    hardSolved: 50,
    totalQuestions: 3200,
    easyQuestions: 800,
    mediumQuestions: 1600,
    hardQuestions: 800,
  };

  const currentStats = stats || mockStats;

  const getPercent = (solved: number, total: number) => {
    if (!total) return 0;
    return Math.min(100, Math.round((solved / total) * 100));
  };

  const totalPercent = getPercent(currentStats.totalSolved, currentStats.totalQuestions);
  const easyPercent = getPercent(currentStats.easySolved, currentStats.easyQuestions);
  const mediumPercent = getPercent(currentStats.mediumSolved, currentStats.mediumQuestions);
  const hardPercent = getPercent(currentStats.hardSolved, currentStats.hardQuestions);

  return (
    <>
      <Card className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none rounded-xl overflow-hidden transition-colors duration-300">
        <div className={`p-6 transition-all duration-500 ${!username ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-3 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">LeetCode Profile</span>
                  {username && (
                    <a
                      href={`https://leetcode.com/${username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 pointer-events-auto"
                      title="View LeetCode profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate font-sans">
                  {username || 'Not Connected'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 font-semibold mb-1 text-[11px]">
                    <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Rank</span>
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 leading-none">
                    {currentStats.ranking ? `#${currentStats.ranking.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 font-semibold mb-1 text-[11px]">
                    <Medal className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Reputation</span>
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 leading-none">
                    {currentStats.reputation ? currentStats.reputation.toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col items-center justify-center py-2 lg:border-l lg:border-r border-zinc-100 dark:border-zinc-900 px-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    strokeWidth="7"
                    stroke="currentColor"
                    className="text-zinc-100 dark:text-zinc-900"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    strokeWidth="7"
                    stroke="currentColor"
                    className="text-zinc-900 dark:text-zinc-100 transition-all duration-1000 ease-out"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * totalPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">
                    {currentStats.totalSolved}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-1">
                    Solved
                  </span>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                  out of {currentStats.totalQuestions.toLocaleString()} questions
                </span>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3 px-2">
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Easy</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-sans">
                    {currentStats.easySolved} <span className="text-zinc-400 dark:text-zinc-500 font-normal">/ {currentStats.easyQuestions}</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${easyPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-amber-600 dark:text-amber-400 text-[11px]">Medium</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-sans">
                    {currentStats.mediumSolved} <span className="text-zinc-400 dark:text-zinc-500 font-normal">/ {currentStats.mediumQuestions}</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${mediumPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-rose-600 dark:text-rose-400 text-[11px]">Hard</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-sans">
                    {currentStats.hardSolved} <span className="text-zinc-400 dark:text-zinc-500 font-normal">/ {currentStats.hardQuestions}</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${hardPercent}%` }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {!username && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-zinc-50/10 dark:bg-zinc-950/10 backdrop-blur-[1px]">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-md mb-2">
              <Lock className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Connect LeetCode Account</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] mb-3 mt-1 font-sans">
              Sync and display your live LeetCode stats, global ranking, and difficulty breakdown here.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="text-xs bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg h-8 px-4 font-sans font-semibold cursor-pointer"
            >
              Connect Profile
            </Button>
          </div>
        )}

        {loading && username && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[0.5px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium text-xs font-sans">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching stats from LeetCode...</span>
            </div>
          </div>
        )}

        {error && username && !loading && (
          <div className="absolute inset-0 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center text-center p-4">
            <AlertTriangle className="w-7 h-7 text-rose-500 mb-2 shrink-0 animate-bounce" />
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 font-sans">{error}</p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchStats(true)}
                className="text-[11px] h-7 gap-1 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 font-sans"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalOpen(true)}
                className="text-[11px] h-7 gap-1 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 font-sans"
              >
                <Settings className="w-3 h-3" />
                Edit Profile
              </Button>
            </div>
          </div>
        )}

        {username && !loading && !error && (
          <button
            onClick={() => setModalOpen(true)}
            className="absolute top-4 right-4 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            title="Edit LeetCode profile settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </Card>

      <LeetCodeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
