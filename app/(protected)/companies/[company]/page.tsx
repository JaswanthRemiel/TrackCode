'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { buttonVariants } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { Problem, UserProgress } from '@/types';
import { collection, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { ExternalLink, MoreHorizontal, Filter, StickyNote, Save, Copy, Search } from 'lucide-react';
import React, { useEffect, useState, use, useMemo, useDeferredValue } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUserNotes } from '@/hooks/useUserNotes';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const MOCK_PROBLEMS: Problem[] = [
  { id: '1', title: 'Two Sum', difficulty: 'EASY', leetcodeUrl: 'https://leetcode.com/problems/two-sum', tags: ['Array', 'Hash Table'], company: 'google' },
  { id: '2', title: 'Add Two Numbers', difficulty: 'MEDIUM', leetcodeUrl: 'https://leetcode.com/problems/add-two-numbers', tags: ['Linked List', 'Math'], company: 'google' },
  { id: '3', title: 'Median of Two Sorted Arrays', difficulty: 'HARD', leetcodeUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays', tags: ['Array', 'Binary Search'], company: 'google' },
];

export default function CompanyPage(props: { params: Promise<{ company: string }> }) {
  const params = use(props.params);
  const companyName = decodeURIComponent(params.company);
  const { userData } = useAuth();
  const { problems: allProblems, userProgress: progress, loading: dataLoading } = useData();
  const { notes, loading: notesLoading } = useUserNotes(userData?.uid);
  const loading = dataLoading || notesLoading;

  const problems = useMemo(() => {
    const list = allProblems.filter(p => {
       const comps = Array.isArray(p.company) ? p.company : [p.company];
       return comps.some(c => c.toLowerCase() === companyName.toLowerCase());
     });
    return list.length > 0 ? list : MOCK_PROBLEMS;
  }, [allProblems, companyName]);

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);

  const [editingNote, setEditingNote] = useState<{ id: string, title: string } | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNote = async () => {
    if (!userData || !editingNote) return;
    setIsSaving(true);
    try {
      const noteDoc = {
        userId: userData.uid,
        problemId: editingNote.id,
        content: noteContent
      };
      await setDoc(doc(db, 'notes', `${userData.uid}_${editingNote.id}`), noteDoc);
      setEditingNote(null);
    } catch (e) {
      console.error("Failed to save note", e);
    } finally {
      setIsSaving(false);
    }
  };

  const openNoteDialog = (problemId: string, title: string) => {
    setEditingNote({ id: problemId, title });
    setNoteContent(notes[problemId] || '');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleUpdateStatus = async (problemId: string, status: 'todo' | 'done' | 'revision') => {
    if (!userData) return;
    try {
      const progDoc: UserProgress = {
        userId: userData.uid,
        problemId,
        status,
      };
      if (status === 'done') {
        progDoc.completedAt = Date.now();
      }

      const docId = `${userData.uid}_${problemId}`;
      await setDoc(doc(db, 'userProgress', docId), progDoc);

      const prevStatus = progress[problemId]?.status || 'todo';
      const isNewDone = status === 'done' && prevStatus !== 'done';
      const isUndoDone = status !== 'done' && prevStatus === 'done';

      if (isNewDone || isUndoDone) {
        const change = isNewDone ? 1 : -1;
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA');

        let targetDateStr = dateStr;
        if (isUndoDone && progress[problemId]?.completedAt) {
          try {
            targetDateStr = new Date(progress[problemId].completedAt).toLocaleDateString('en-CA');
          } catch (e) {
            console.error("Failed to parse completion date:", e);
          }
        }

        const activityRef = doc(db, 'dailyActivity', `${userData.uid}_${targetDateStr}`);
        await setDoc(activityRef, {
          date: targetDateStr,
          userId: userData.uid,
          problemsSolved: increment(change)
        }, { merge: true });

        const userUpdates: any = {
          totalSolved: increment(change)
        };

        if (isNewDone) {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString('en-CA');

          const lastActive = userData.lastActiveDate;
          const currentStreak = Number(userData.currentStreak) || 0;
          const longestStreak = Number(userData.longestStreak) || 0;

          if (lastActive !== dateStr) {
            if (lastActive === yesterdayStr) {
              const nextStreak = currentStreak + 1;
              userUpdates.currentStreak = nextStreak;
              if (nextStreak > longestStreak) {
                userUpdates.longestStreak = nextStreak;
              }
            } else {
              userUpdates.currentStreak = 1;
              if (1 > longestStreak) {
                userUpdates.longestStreak = 1;
              }
            }
            userUpdates.lastActiveDate = dateStr;
          }
        }

        await updateDoc(doc(db, 'users', userData.uid), userUpdates);
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const filtered = useMemo(() => {
    return problems.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(deferredSearch.toLowerCase()));
      const matchesDiff = difficultyFilter ? p.difficulty === difficultyFilter : true;
      return matchesSearch && matchesDiff;
    });
  }, [problems, deferredSearch, difficultyFilter]);

  const solvedProblems = problems.filter(p => progress[p.id]?.status === 'done');
  const solvedCount = solvedProblems.length;
  const totalCount = problems.length;
  const percent = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;

  const difficultyStats = {
    EASY: {
      solved: solvedProblems.filter(p => p.difficulty === 'EASY').length,
      total: problems.filter(p => p.difficulty === 'EASY').length
    },
    MEDIUM: {
      solved: solvedProblems.filter(p => p.difficulty === 'MEDIUM').length,
      total: problems.filter(p => p.difficulty === 'MEDIUM').length
    },
    HARD: {
      solved: solvedProblems.filter(p => p.difficulty === 'HARD').length,
      total: problems.filter(p => p.difficulty === 'HARD').length
    }
  };

  return (
    <div className="space-y-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Breadcrumb className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/companies" className="hover:text-zinc-900 dark:hover:text-zinc-100">Companies</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-zinc-800 dark:text-zinc-200 capitalize">{companyName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 capitalize leading-none">{companyName}</h1>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 min-w-full md:min-w-[240px] shadow-none transition-colors duration-300">
           <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Overall Mastery</p>
                <p className="font-bold text-lg text-zinc-900 dark:text-zinc-50">{solvedCount} <span className="text-zinc-400 dark:text-zinc-600 text-xs font-normal">/ {totalCount}</span></p>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-700 ease-out" 
                  style={{ width: `${percent}%` }}
                />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <DifficultyCard label="Easy" solved={difficultyStats.EASY.solved} total={difficultyStats.EASY.total} color="bg-emerald-500" />
        <DifficultyCard label="Medium" solved={difficultyStats.MEDIUM.solved} total={difficultyStats.MEDIUM.total} color="bg-amber-500" />
        <DifficultyCard label="Hard" solved={difficultyStats.HARD.solved} total={difficultyStats.HARD.total} color="bg-rose-500" />
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-none overflow-hidden rounded-xl bg-white dark:bg-zinc-950 transition-colors duration-300">
        <CardContent className="p-0">
          <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <Input
                placeholder="Search problems or topics..."
                className="pl-9 w-full h-10 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "w-full md:w-auto md:min-w-[180px] px-4 gap-3 h-10 justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900" })}>
                {difficultyFilter ? difficultyFilter : 'All Difficulties'}
                <Filter className="w-3.5 h-3.5 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg">
                <DropdownMenuItem onClick={() => setDifficultyFilter(null)} className="text-xs cursor-pointer">All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter('EASY')} className="text-xs cursor-pointer text-emerald-600">Easy</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter('MEDIUM')} className="text-xs cursor-pointer text-amber-600">Medium</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter('HARD')} className="text-xs cursor-pointer text-rose-600">Hard</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-x-auto w-full scrollbar-hide">
            <Table className="min-w-[600px] md:min-w-full text-zinc-900 dark:text-zinc-50">
              <TableHeader>
                <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="w-[100px] md:w-[120px] pl-4 md:pl-6 text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Status</TableHead>
                  <TableHead className="text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Title</TableHead>
                  <TableHead className="text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Difficulty</TableHead>
                  <TableHead className="hidden md:table-cell text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Topics</TableHead>
                  <TableHead className="w-[50px] pr-4 md:pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-zinc-400 italic text-sm">Deep diving into data...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-zinc-400 italic text-sm">No candidates found matching your criteria.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((problem) => {
                    const stat = progress[problem.id]?.status || 'todo';
                    return (
                      <TableRow key={problem.id} className="group border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <TableCell className="pl-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                                className: `w-[90px] h-7 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all border ${
                                  stat === 'done'
                                    ? 'bg-emerald-100/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/30 hover:bg-emerald-200/60 dark:hover:bg-emerald-950/50'
                                    : stat === 'revision'
                                      ? 'bg-amber-100/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/30 hover:bg-amber-200/60 dark:hover:bg-amber-950/50'
                                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-850'
                                }`
                              })}
                            >
                              {stat === 'todo' ? 'Todo' : stat === 'done' ? 'Done' : 'Revise'}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-md">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(problem.id, 'todo')} className="text-xs font-medium px-2 py-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer">Todo</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(problem.id, 'done')} className="text-xs font-medium px-2 py-1 rounded text-emerald-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer">Done</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(problem.id, 'revision')} className="text-xs font-medium px-2 py-1 rounded text-amber-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer">Revise</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 py-1">
                            <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1 group/link">
                              <span className="text-sm md:text-base text-zinc-800 dark:text-zinc-200 transition-colors group-hover:text-zinc-950 dark:group-hover:text-zinc-50 leading-tight">{problem.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-10 group-hover/link:opacity-100 transition-opacity text-zinc-500" />
                            </a>
                            {notes[problem.id] && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openNoteDialog(problem.id, problem.title);
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-800 ml-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                title="Click to view/edit note"
                              >
                                <StickyNote className="w-2.5 h-2.5" />
                                <span>Note</span>
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${problem.difficulty === 'EASY'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                            : problem.difficulty === 'MEDIUM'
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                            }`}>
                            {problem.difficulty}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {problem.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded bg-zinc-50/50 dark:bg-zinc-900/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger className={buttonVariants({ 
                                variant: "ghost", 
                                size: "icon", 
                                className: "h-8 w-8 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-550 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors" 
                              })}>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-md">
                              <DropdownMenuItem onClick={() => openNoteDialog(problem.id, problem.title)} className="gap-2 font-medium px-2 py-1.5 cursor-pointer text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded">
                                <StickyNote className="w-3.5 h-3.5 text-zinc-500" />
                                Personal Note
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(problem.leetcodeUrl)} className="gap-2 font-medium px-2 py-1.5 cursor-pointer text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded">
                                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuItem className="p-0 cursor-pointer rounded hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                 <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium px-2 py-1.5 w-full h-full text-xs">
                                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                                    LeetCode
                                 </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-0 overflow-hidden bg-white dark:bg-zinc-950">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <StickyNote className="w-4 h-4" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Personal Note</DialogTitle>
              </div>
              <DialogDescription className="text-zinc-400 dark:text-zinc-500 text-xs italic font-medium">
                {editingNote?.title}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Insights & Tips</label>
               <Textarea 
                placeholder="What did you learn? Are there any tricky edge cases for this problem?"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[180px] text-sm leading-relaxed border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100"
               />
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setEditingNote(null)} className="rounded-lg font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-transparent">Cancel</Button>
            <Button 
               onClick={handleSaveNote} 
               disabled={isSaving}
               className="rounded-lg px-6 font-bold bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 shadow-none flex items-center gap-1.5"
            >
              {isSaving ? "Saving..." : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DifficultyCard({ label, solved, total, color }: { label: string, solved: number, total: number, color: string }) {
  const percent = total > 0 ? (solved / total) * 100 : 0;
  return (
    <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none rounded-xl transition-colors duration-300">
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
          <p className="font-bold text-lg text-zinc-900 dark:text-zinc-50">{solved} <span className="text-zinc-400 dark:text-zinc-650 text-xs font-normal">/ {total}</span></p>
        </div>
        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-700 ease-out`} 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

