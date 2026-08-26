import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Download,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import { VideoSolutionsDialog } from "@/components/app/video-solutions-dialog";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { useSheet, useUpdateProgress } from "@/hooks/use-sheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sheets/$sheetId")({
  head: () => ({
    meta: [
      { title: "Sheet · Verdiqx" },
      {
        name: "description",
        content:
          "Work through a custom practice sheet — filter, check off progress, jot notes, and bookmark problems for your profile.",
      },
    ],
  }),
  component: SheetDetailPage,
});

// ---------------- shared storage keys / types ----------------

const BOOKMARKS_KEY = "verdiqx.bookmarks";

interface SheetProblem {
  key: string;
  contestId: number | null;
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  url: string;
}

interface ProblemProgress {
  done: boolean;
  note: string;
  bookmarked: boolean;
}

export interface Bookmark {
  problemKey: string;
  name: string;
  url: string;
  rating: number | null;
  tags: string[];
  sheetId: string;
  sheetName: string;
  bookmarkedAt: number;
}

// ---------------- page ----------------

function SheetDetailPage() {
  const { sheetId } = Route.useParams();
  const sheetQ = useSheet(sheetId);
  const progressMut = useUpdateProgress(sheetId);
  const sheet = sheetQ.data ?? null;
  const notFound = !sheetQ.isLoading && !sheetQ.isError && sheetQ.data === null;
  const [localProgress, setLocalProgress] = useState<Record<string, ProblemProgress>>({});

  useEffect(() => {
    if (!sheet?.progress) return;
    const out: Record<string, ProblemProgress> = {};
    for (const [k, v] of Object.entries(sheet.progress)) {
      out[k] = { done: !!v.done, note: v.note ?? "", bookmarked: !!v.bookmarked };
    }
    setLocalProgress((prev) => ({ ...out, ...prev }));
  }, [sheet?.progress]);

  const progress = useMemo(() => {
    const raw = sheet?.progress ?? {};
    const out: Record<string, ProblemProgress> = {};
    for (const [k, v] of Object.entries(raw)) {
      out[k] = { done: !!v.done, note: v.note ?? "", bookmarked: !!v.bookmarked };
    }
    return { ...out, ...localProgress };
  }, [sheet?.progress, localProgress]);

  const saveProgress = (next: Record<string, ProblemProgress>) => {
    setLocalProgress(next);
    progressMut.mutate(next);
  };

  const getP = (key: string): ProblemProgress =>
    progress[key] ?? { done: false, note: "", bookmarked: false };

  const toggleDone = (key: string) => {
    const p = getP(key);
    saveProgress({ ...progress, [key]: { ...p, done: !p.done } });
  };

  const setNote = (key: string, note: string) => {
    const p = getP(key);
    saveProgress({ ...progress, [key]: { ...p, note } });
  };

  const toggleBookmark = (problem: SheetProblem) => {
    if (!sheet) return;
    const p = getP(problem.key);
    const nextBookmarked = !p.bookmarked;
    saveProgress({
      ...progress,
      [problem.key]: { ...p, bookmarked: nextBookmarked },
    });
    // sync global bookmark list
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY);
      const list = raw ? (JSON.parse(raw) as Bookmark[]) : [];
      const filtered = list.filter(
        (b) => !(b.problemKey === problem.key && b.sheetId === sheet.id),
      );
      if (nextBookmarked) {
        filtered.unshift({
          problemKey: problem.key,
          name: problem.name,
          url: problem.url,
          rating: problem.rating,
          tags: problem.tags,
          sheetId: sheet.id,
          sheetName: sheet.name,
          bookmarkedAt: Date.now(),
        });
      }
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
      toast.success(
        nextBookmarked ? "Bookmarked to your profile" : "Bookmark removed",
      );
    } catch {
      /* ignore */
    }
  };

  // filters
  const [q, setQ] = useState("");
  const [minR, setMinR] = useState<string>("");
  const [maxR, setMaxR] = useState<string>("");
  const [tag, setTag] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "todo" | "bookmarked">("all");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    sheet?.problems?.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [sheet]);

  const filtered = useMemo(() => {
    const problems = sheet?.problems ?? [];
    const lo = minR ? Number(minR) : -Infinity;
    const hi = maxR ? Number(maxR) : Infinity;
    const query = q.trim().toLowerCase();
    return problems.filter((p) => {
      if (p.rating != null && (p.rating < lo || p.rating > hi)) return false;
      if (p.rating == null && (minR || maxR)) return false;
      if (tag !== "all" && !p.tags.includes(tag)) return false;
      if (query && !p.name.toLowerCase().includes(query)) return false;
      const pr = getP(p.key);
      if (statusFilter === "done" && !pr.done) return false;
      if (statusFilter === "todo" && pr.done) return false;
      if (statusFilter === "bookmarked" && !pr.bookmarked) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, minR, maxR, tag, q, statusFilter, progress]);

  const doneCount = useMemo(
    () => Object.values(progress).filter((p) => p.done).length,
    [progress],
  );

  if (notFound) {
    return (
      <AppShell breadcrumb={[{ label: "Cheat Library", to: "/cheatsheets" }, { label: "Not found" }]}>
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold">Sheet not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This sheet may have been deleted or was saved on another device.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/cheatsheets">
              <ArrowLeft className="size-3.5" /> Back to library
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!sheet) {
    return (
      <AppShell breadcrumb={[{ label: "Cheat Library", to: "/cheatsheets" }]}>
        <div className="px-6 py-10 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  const total = sheet.problems?.length ?? 0;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <AppShell
      breadcrumb={[
        { label: "Cheat Library", to: "/cheatsheets" },
        { label: sheet.name },
      ]}
    >
      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-2xs uppercase tracking-widest text-muted-foreground">
              Practice sheet
            </div>
            <h1 className="font-display text-2xl font-semibold">{sheet.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-2xs">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {sheet.minRating}–{sheet.maxRating}
              </span>
              <span className="rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">
                {total} problems
              </span>
              {sheet.contest ? (
                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground">
                  Contest: {sheet.contest}
                </span>
              ) : null}
              {sheet.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted/50 px-2 py-0.5 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => {
                try {
                  const rows = (sheet.problems ?? []).map((p) => {
                    const pg = getP(p.key);
                    return {
                      Status: pg.done ? "Done" : "To do",
                      Bookmarked: pg.bookmarked ? "Yes" : "",
                      Contest: p.contestId ?? "",
                      Index: p.index,
                      Name: p.name,
                      Rating: p.rating ?? "",
                      Tags: (p.tags ?? []).join(", "),
                      URL: p.url,
                      Note: pg.note ?? "",
                    };
                  });
                  const ws = XLSX.utils.json_to_sheet(rows);
                  ws["!cols"] = [
                    { wch: 8 }, { wch: 11 }, { wch: 8 }, { wch: 6 },
                    { wch: 42 }, { wch: 8 }, { wch: 32 }, { wch: 44 }, { wch: 40 },
                  ];
                  const wb = XLSX.utils.book_new();
                  const safeName = sheet.name.slice(0, 28).replace(/[\\/*?:[\]]/g, " ") || "Sheet";
                  XLSX.utils.book_append_sheet(wb, ws, safeName);
                  const fileSafe = sheet.name.replace(/[^a-z0-9-_]+/gi, "_") || "practice-sheet";
                  XLSX.writeFile(wb, `${fileSafe}.xlsx`);
                  toast.success("Exported to Excel");
                } catch (err) {
                  console.error(err);
                  toast.error("Export failed");
                }
              }}
            >
              <Download className="size-3.5" />
              Export Excel
            </Button>
            <div className="min-w-[220px] rounded-xl border border-border/60 bg-surface/50 p-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">
                  {doneCount}/{total} ({pct}%)
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-border/60 bg-surface/30 p-3">
          <div className="flex flex-1 min-w-[180px] flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Problem name…"
                className="h-8 pl-7 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Rating
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={minR}
                onChange={(e) => setMinR(e.target.value)}
                placeholder="min"
                className="h-8 w-20 text-xs"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="number"
                value={maxR}
                onChange={(e) => setMaxR(e.target.value)}
                placeholder="max"
                className="h-8 w-20 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Tag
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">All</option>
              <option value="todo">To do</option>
              <option value="done">Done</option>
              <option value="bookmarked">Bookmarked</option>
            </select>
          </div>
        </div>

        {/* Problem list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-surface/30 p-8 text-center text-sm text-muted-foreground">
              No problems match these filters.
            </div>
          ) : (
            filtered.map((p) => (
              <ProblemRow
                key={p.key}
                problem={p}
                progress={getP(p.key)}
                onToggleDone={() => toggleDone(p.key)}
                onNote={(v) => setNote(p.key, v)}
                onBookmark={() => toggleBookmark(p)}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ---------------- row ----------------

function ProblemRow({
  problem,
  progress,
  onToggleDone,
  onNote,
  onBookmark,
}: {
  problem: SheetProblem;
  progress: ProblemProgress;
  onToggleDone: () => void;
  onNote: (v: string) => void;
  onBookmark: () => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [videosOpen, setVideosOpen] = useState(false);
  const navigate = useNavigate();
  const contestLabel = problem.contestId ? `${problem.contestId}${problem.index}` : problem.index;
  const askMentor = () => {
    const tagStr = problem.tags.length ? problem.tags.join(", ") : "none";
    const idStr = problem.contestId ? `${problem.contestId}${problem.index}` : problem.index;
    const ratingStr = problem.rating != null ? `${problem.rating}` : "unrated";
    const prompt = `Please explain this Codeforces problem end-to-end.

Problem: ${problem.name} (${idStr})
Rating: ${ratingStr}
Tags: ${tagStr}
Link: ${problem.url}

Walk me through:
1. A clear restatement of the problem.
2. The key observation / intuition.
3. The full approach with complexity.
4. A clean C++ solution with brief comments.
5. Common pitfalls / edge cases.`;
    try {
      sessionStorage.setItem("verdiqx.mentor.pending-prompt", prompt);
    } catch {
      /* ignore */
    }
    toast.success("Sending to mentor…");
    navigate({ to: "/mentor" });
  };
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-surface/40 p-3 transition",
        progress.done && "bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleDone}
          aria-label={progress.done ? "Mark as not done" : "Mark as done"}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
        >
          {progress.done ? (
            <CheckCircle2 className="size-5 text-primary" />
          ) : (
            <Circle className="size-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={problem.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "truncate text-sm font-medium hover:underline",
                progress.done && "text-muted-foreground line-through",
              )}
            >
              {problem.name}
            </a>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs text-muted-foreground">
            <span className="font-mono">
              {problem.contestId ? `${problem.contestId}${problem.index}` : problem.index}
            </span>
            {problem.rating != null && (
              <span className="rounded-full border border-border/50 px-1.5 py-0.5 tabular-nums">
                {problem.rating}
              </span>
            )}
            {problem.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="rounded-full bg-muted/50 px-1.5 py-0.5"
              >
                {t}
              </span>
            ))}
            {problem.tags.length > 5 && (
              <span>+{problem.tags.length - 5}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={askMentor}
            aria-label="Ask mentor to explain"
            title="Ask AI mentor to explain this problem"
            className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            <Sparkles className="size-4" />
          </button>
          <button
            onClick={() => setVideosOpen(true)}
            aria-label="Watch video solutions"
            title="Find video solutions on YouTube"
            className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
          >
            <Video className="size-4" />
          </button>
          <button
            onClick={() => setNoteOpen((v) => !v)}
            aria-label="Toggle note"
            className={cn(
              "rounded p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              (progress.note || noteOpen) && "text-primary",
            )}
            title={progress.note ? "Has note" : "Add note"}
          >
            <FileText className="size-4" />
          </button>
          <button
            onClick={onBookmark}
            aria-label={progress.bookmarked ? "Remove bookmark" : "Bookmark"}
            className={cn(
              "rounded p-1.5 hover:bg-muted/60",
              progress.bookmarked
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {progress.bookmarked ? (
              <BookmarkCheck className="size-4" />
            ) : (
              <Bookmark className="size-4" />
            )}
          </button>
        </div>
      </div>

      {(noteOpen || progress.note) && (
        <div className="mt-3 pl-8">
          <textarea
            value={progress.note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Your notes: approach, edge cases, why it stumped you…"
            rows={3}
            className="w-full resize-y rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      <VideoSolutionsDialog
        open={videosOpen}
        onOpenChange={setVideosOpen}
        problemKey={problem.key}
        problemName={problem.name}
        contestLabel={contestLabel}
      />
    </div>
  );
}
