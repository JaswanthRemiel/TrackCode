'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { useUserNotes } from '@/hooks/useUserNotes';
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
import { Problem, UserProgress, Note } from '@/types';
import { collection, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { ExternalLink, MoreHorizontal, Filter, StickyNote, Save, Check, Copy } from 'lucide-react';
import React, { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';


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


        const activityRef = doc(db, 'dailyActivity', `${userData.uid}_${dateStr}`);
        await setDoc(activityRef, {
          date: dateStr,
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

  const filtered = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesDiff = difficultyFilter ? p.difficulty === difficultyFilter : true;
    return matchesSearch && matchesDiff;
  });

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
    <div className="space-y-6 md:space-y-10 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link href="/companies" className="hover:text-primary transition-colors">Companies</Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200">{companyName}</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-serif text-slate-900 dark:text-white capitalize leading-tight">{companyName} Target.</h1>
        </div>

        <div className="bg-white dark:bg-card p-6 rounded-2xl md:rounded-3xl border border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 min-w-full md:min-w-[240px] transition-colors duration-300">
           <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Mastery</p>
                <p className="font-serif text-xl md:text-2xl">{solvedCount} <span className="text-slate-300 dark:text-slate-600 text-lg">/ {totalCount}</span></p>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out shadow-lg shadow-primary/20" 
                  style={{ width: `${percent}%` }}
                />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DifficultyCard label="Easy" solved={difficultyStats.EASY.solved} total={difficultyStats.EASY.total} color="bg-emerald-500" />
        <DifficultyCard label="Medium" solved={difficultyStats.MEDIUM.solved} total={difficultyStats.MEDIUM.total} color="bg-amber-500" />
        <DifficultyCard label="Hard" solved={difficultyStats.HARD.solved} total={difficultyStats.HARD.total} color="bg-rose-500" />
      </div>

      <Card className="border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.02] dark:shadow-black/20 overflow-hidden rounded-2xl md:rounded-3xl transition-colors duration-300">
        <CardContent className="p-0">
          <div className="p-4 md:p-6 border-b border-black/5 dark:border-white/5 flex flex-col md:flex-row gap-4 justify-between md:items-center bg-slate-50/30 dark:bg-white/[0.02]">
            <Input
              placeholder="Search problems or topics..."
              className="w-full md:max-w-sm h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "w-full md:w-[150px] h-11 justify-between rounded-xl" })}>
                {difficultyFilter ? difficultyFilter : 'All Difficulties'}
                <Filter className="w-4 h-4 ml-2 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setDifficultyFilter(null)}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter('EASY')}>Easy</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter('MEDIUM')}>Medium</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficultyFilter('HARD')}>Hard</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-x-auto w-full scrollbar-hide">
            <Table className="min-w-[600px] md:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] md:w-[120px] pl-4 md:pl-6 text-slate-400 uppercase text-[9px] md:text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-slate-400 uppercase text-[9px] md:text-[10px] tracking-widest">Title</TableHead>
                  <TableHead className="text-slate-400 uppercase text-[9px] md:text-[10px] tracking-widest">Difficulty</TableHead>
                  <TableHead className="hidden md:table-cell text-slate-400 uppercase text-[10px] tracking-widest">Topics</TableHead>
                  <TableHead className="w-[50px] pr-4 md:pr-6"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic font-serif">Deep diving into data...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic font-serif">No candidates found matching your criteria.</TableCell>
                </TableRow>
              ) : (
                filtered.map((problem) => {
                  const stat = progress[problem.id]?.status || 'todo';
                  return (
                    <TableRow key={problem.id} className="group border-black/[0.03] dark:border-white/[0.03] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <TableCell className="pl-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: `w-[90px] h-7 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border-2 ${stat === 'done'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-4 ring-emerald-500/5'
                                : stat === 'revision'
                                  ? 'bg-amber-50 text-amber-600 border-amber-100 ring-4 ring-amber-500/5'
                                  : 'bg-white dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                                }`
                            })}
                          >
                            {stat === 'todo' ? 'Todo' : stat === 'done' ? 'Done' : 'Revise'}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-xl border-black/5 shadow-2xl">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(problem.id, 'todo')} className="text-xs font-bold font-serif">Todo</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(problem.id, 'done')} className="text-xs font-bold font-serif text-emerald-600">Done</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(problem.id, 'revision')} className="text-xs font-bold font-serif text-amber-600">Revise</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1 py-2">
                          <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-2 group/link">
                            <span className="font-serif text-base md:text-lg text-slate-800 dark:text-slate-200 transition-colors group-hover:text-primary leading-tight">{problem.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-10 group-hover/link:opacity-100 transition-opacity" />
                            {notes[problem.id] && (
                              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-accent/5 text-accent rounded-md border border-accent/10 ml-2 animate-in zoom-in-50 duration-500">
                                 <StickyNote className="w-3 h-3" />
                                 <span className="text-[10px] font-bold uppercase tracking-wider">Note Added</span>
                              </div>
                            )}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${problem.difficulty === 'EASY'
                          ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-50'
                          : problem.difficulty === 'MEDIUM'
                            ? 'bg-amber-50/50 text-amber-600 border-amber-100 group-hover:bg-amber-50'
                            : 'bg-rose-50/50 text-rose-600 border-rose-100 group-hover:bg-rose-50'
                          }`}>
                          {problem.difficulty}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {problem.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 border border-black/5 dark:border-white/5 px-2 py-0.5 rounded-md bg-slate-50/30 dark:bg-white/[0.03]">
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
                              className: "h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100" 
                            })}>
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-black/5 shadow-2xl p-1.5">
                            <DropdownMenuItem onClick={() => openNoteDialog(problem.id, problem.title)} className="gap-2 font-bold font-serif px-3 py-2 cursor-pointer">
                              <StickyNote className="w-4 h-4 text-accent" />
                              Personal Note
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(problem.leetcodeUrl)} className="gap-2 font-bold font-serif px-3 py-2 cursor-pointer">
                              <Copy className="w-4 h-4 text-slate-400" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem className="p-0 cursor-pointer">
                               <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold font-serif px-3 py-2 w-full h-full">
                                  <ExternalLink className="w-4 h-4 text-slate-400" />
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

      {}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl border-black/5 dark:border-white/5 shadow-2xl dark:shadow-black/30 p-0 overflow-hidden">
          <div className="bg-slate-50/80 dark:bg-white/[0.03] p-8 border-b border-black/5 dark:border-white/5">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-accent text-white p-2 rounded-xl">
                  <StickyNote className="w-5 h-5" />
                </div>
                <DialogTitle className="text-3xl font-serif tracking-tight">Personal Note</DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 font-medium italic">
                {editingNote?.title}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-3">
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Insights & Tips</label>
               <Textarea 
                placeholder="What did you learn? Are there any tricky edge cases for this problem?"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[220px] text-base leading-relaxed"
               />
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50/80 dark:bg-white/[0.03] border-t border-black/5 dark:border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setEditingNote(null)} className="rounded-full font-bold text-slate-400">Cancel</Button>
            <Button 
               onClick={handleSaveNote} 
               disabled={isSaving}
               className="rounded-full px-8 font-bold bg-primary shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2"
            >
              {isSaving ? "Saving..." : (
                <>
                  <Save className="w-4 h-4" />
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
    <Card className="p-6 border-black/5 dark:border-white/5 shadow-xl shadow-black/[0.01] dark:shadow-black/20 bg-white dark:bg-card transition-colors duration-300">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="font-serif text-xl">{solved} <span className="text-slate-300 dark:text-slate-600 text-sm">/ {total}</span></p>
        </div>
        <div className="h-1 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-1000 ease-out shadow-sm`} 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
