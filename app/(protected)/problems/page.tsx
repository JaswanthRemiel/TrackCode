'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/components/data/DataProvider';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { db } from '@/lib/firebase';
import { Problem, UserProgress } from '@/types';
import { collection, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { ExternalLink, MoreHorizontal, Filter, StickyNote, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle2, Search } from 'lucide-react';
import React, { useEffect, useState, useMemo, useDeferredValue } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUserNotes } from '@/hooks/useUserNotes';

const ITEMS_PER_PAGE = 50;

export default function ProblemsPage() {
  const { userData } = useAuth();
  const { problems, userProgress: progress, loading: dataLoading } = useData();
  const { notes, loading: notesLoading } = useUserNotes(userData?.uid);
  const loading = dataLoading || notesLoading;

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, difficultyFilter, statusFilter]);

  // Filter & Sort Alphabetically
  const filteredProblems = useMemo(() => {
    let result = [...problems];

    // Filter by search query
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      result = result.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(q);
        const tagMatch = p.tags.some(t => t.toLowerCase().includes(q));
        const companies = (Array.isArray(p.company) ? p.company : [p.company]) as string[];
        const companyMatch = companies.some(c => c.toLowerCase().includes(q));
        return titleMatch || tagMatch || companyMatch;
      });
    }

    // Filter by difficulty
    if (difficultyFilter) {
      result = result.filter(p => p.difficulty === difficultyFilter);
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter(p => {
        const stat = progress[p.id]?.status || 'todo';
        return stat === statusFilter;
      });
    }

    // Sort alphabetically
    result.sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [problems, deferredSearch, difficultyFilter, statusFilter, progress]);

  // Paginated segment
  const paginatedProblems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProblems, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / ITEMS_PER_PAGE));

  // Overall progress stats for the user
  const solvedCount = useMemo(() => {
    return Object.values(progress).filter(p => p.status === 'done').length;
  }, [progress]);

  const totalCount = problems.length;

  if (!userData) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Problems</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Browse all {totalCount} curated interview problems alphabetical-wise. Done problems sync everywhere.
          </p>
        </div>
        
        {/* Progress Overview Card */}
        <div className="flex items-center gap-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl px-4 py-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-zinc-700 dark:text-zinc-350">
            Total Solved: {solvedCount} / {totalCount} ({totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0}%)
          </span>
        </div>
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-none overflow-hidden rounded-xl bg-white dark:bg-zinc-950 transition-colors duration-300">
        <CardContent className="p-0">
          {/* Filters Bar */}
          <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <Input
                placeholder="Search problems, topics, or companies..."
                className="pl-9 w-full h-10 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Difficulty Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "w-1/2 sm:w-auto sm:min-w-[180px] px-4 gap-3 h-10 justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900" })}>
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

              {/* Status Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "w-1/2 sm:w-auto sm:min-w-[160px] px-4 gap-3 h-10 justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900" })}>
                  {statusFilter === 'todo' ? 'Todo' : statusFilter === 'done' ? 'Done' : statusFilter === 'revision' ? 'Revise' : 'All Statuses'}
                  <Filter className="w-3.5 h-3.5 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg">
                  <DropdownMenuItem onClick={() => setStatusFilter(null)} className="text-xs cursor-pointer">All Statuses</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('todo')} className="text-xs cursor-pointer text-zinc-500">Todo</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('done')} className="text-xs cursor-pointer text-emerald-600">Done</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('revision')} className="text-xs cursor-pointer text-amber-600">Revise</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-x-auto w-full scrollbar-hide">
            <Table className="min-w-[600px] md:min-w-full text-zinc-900 dark:text-zinc-50">
              <TableHeader>
                <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="w-[100px] md:w-[120px] pl-4 md:pl-6 text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Status</TableHead>
                  <TableHead className="text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Title</TableHead>
                  <TableHead className="text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Difficulty</TableHead>
                  <TableHead className="hidden md:table-cell text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Topics</TableHead>
                  <TableHead className="hidden lg:table-cell text-zinc-400 dark:text-zinc-500 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">Companies</TableHead>
                  <TableHead className="w-[50px] pr-4 md:pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-zinc-400 italic text-sm">Deep diving into data...</TableCell>
                  </TableRow>
                ) : paginatedProblems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-zinc-400 italic text-sm">No problems found matching your criteria.</TableCell>
                  </TableRow>
                ) : (
                  paginatedProblems.map((problem) => {
                    const stat = progress[problem.id]?.status || 'todo';
                    const companies = (Array.isArray(problem.company) ? problem.company : [problem.company]) as string[];
                    return (
                      <TableRow key={problem.id} className="group border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <TableCell className="pl-4 md:pl-6">
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
                              <span className="text-sm text-zinc-800 dark:text-zinc-200 transition-colors group-hover:text-zinc-950 dark:group-hover:text-zinc-50 leading-tight">{problem.title}</span>
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
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {companies.slice(0, 3).map(c => (
                              <span key={c} className="text-[9px] font-bold text-zinc-550 dark:text-zinc-405 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-transparent">
                                {c}
                              </span>
                            ))}
                            {companies.length > 3 && (
                              <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-505 self-center">
                                +{companies.length - 3} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="pr-4 md:pr-6">
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
                                <StickyNote className="w-3.5 h-3.5 text-zinc-555" />
                                Personal Note
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(problem.leetcodeUrl)} className="gap-2 font-medium px-2 py-1.5 cursor-pointer text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded">
                                <ExternalLink className="w-3.5 h-3.5 text-zinc-450" />
                                Copy URL
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-555 dark:text-zinc-405 font-medium">
                Page {currentPage} of {totalPages} (Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProblems.length)} of {filteredProblems.length} matching)
              </span>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note Dialog */}
      <Dialog open={editingNote !== null} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl max-w-lg shadow-xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Personal Note
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              Add details, thoughts, or custom templates to remind you how you solved <span className="font-bold text-zinc-900 dark:text-zinc-100">{editingNote?.title}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write down your insights, code structures or gotchas..."
              className="min-h-[160px] w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100"
            />
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 text-right">
            <Button
              variant="ghost"
              onClick={() => setEditingNote(null)}
              className="h-10 px-4 rounded-lg font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={isSaving}
              className="h-10 px-5 rounded-lg font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-none flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
