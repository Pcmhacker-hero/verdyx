import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  Clock,
  Loader2,
  Play,
  Save,
  Search,
  Shuffle,
  Sparkles,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { useActiveSheets } from "@/hooks/use-sheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Custom Contest · Verdiqy" },
      {
        name: "description",
        content:
          "Build your own contest — pick source, rating range, topics, and duration. Generate from AI, sheets, bookmarks, or any Codeforces handle.",
      },
    ],
  }),
  component: CustomContestPage,
});

/* ============================================================
 * STORAGE + TYPES
 * ============================================================ */

const SAVED_CONTESTS_KEY = "verdiqy.custom-contests";
const BOOKMARKS_KEY = "verdiqy.bookmarks";

const SOLVED_HANDLES_KEY = "verdiqy.solved-handles"; // { handle: string[] problemKeys }

type Source = "ai" | "sheet" | "bookmarks" | "handle";
type Progression = "flat" | "ascending" | "wave";

interface ContestProblem {
  key: string; // e.g. "1850-E"
  contestId: number | null;
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  url: string;
}

interface SavedContest {
  id: string;
  name: string;
  source: Source;
  handle?: string;
  sheetId?: string;
  numProblems: number;
  minRating: number;
  maxRating: number;
  topics: string[];
  durationMin: number;
  progression: Progression;
  excludeSolved: boolean;
  problems: ContestProblem[];
  createdAt: number;
}

interface StoredBookmark {
  problemKey: string;
  name: string;
  url: string;
  rating: number | null;
  tags: string[];
}

interface StoredSheet {
  id: string;
  name: string;
  problems?: ContestProblem[];
}

/* ============================================================
 * CF API HELPERS
 * ============================================================ */

const CF_TOPICS = [
  "implementation",
  "greedy",
  "math",
  "dp",
  "data structures",
  "brute force",
  "constructive algorithms",
  "graphs",
  "sortings",
  "binary search",
  "dfs and similar",
  "trees",
  "strings",
  "number theory",
  "combinatorics",
  "geometry",
  "bitmasks",
  "two pointers",
  "shortest paths",
  "hashing",
  "probabilities",
  "divide and conquer",
  "games",
  "flows",
  "matrices",
];

async function fetchSolvedForHandle(handle: string): Promise<Set<string>> {
  const res = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`,
  );
  const json = await res.json();
  if (json.status !== "OK") throw new Error(json.comment ?? "Failed to load handle");
  const solved = new Set<string>();
  for (const sub of json.result as Array<{
    verdict?: string;
    problem: { contestId?: number; index: string };
  }>) {
    if (sub.verdict !== "OK" || !sub.problem.contestId) continue;
    solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
  }
  return solved;
}

async function fetchAttemptedForHandle(handle: string): Promise<Set<string>> {
  const res = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`,
  );
  const json = await res.json();
  if (json.status !== "OK") throw new Error(json.comment ?? "Failed to load handle");
  const seen = new Set<string>();
  for (const sub of json.result as Array<{
    problem: { contestId?: number; index: string };
  }>) {
    if (!sub.problem.contestId) continue;
    seen.add(`${sub.problem.contestId}-${sub.problem.index}`);
  }
  return seen;
}

/** Full problemset (cached per session). */
let PROBLEMSET_CACHE: ContestProblem[] | null = null;
async function fetchProblemset(): Promise<ContestProblem[]> {
  if (PROBLEMSET_CACHE) return PROBLEMSET_CACHE;
  const res = await fetch("https://codeforces.com/api/problemset.problems");
  const json = await res.json();
  if (json.status !== "OK") throw new Error(json.comment ?? "Failed to load problems");
  const problems = (json.result.problems as Array<{
    contestId?: number;
    index: string;
    name: string;
    rating?: number;
    tags: string[];
  }>)
    .filter((p) => p.contestId)
    .map<ContestProblem>((p) => ({
      key: `${p.contestId}-${p.index}`,
      contestId: p.contestId ?? null,
      index: p.index,
      name: p.name,
      rating: p.rating ?? null,
      tags: p.tags,
      url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
    }));
  PROBLEMSET_CACHE = problems;
  return problems;
}

/* ============================================================
 * BUILDER LOGIC
 * ============================================================ */

interface BuildArgs {
  source: Source;
  handle: string;
  sheetId: string;
  numProblems: number;
  minRating: number;
  maxRating: number;
  topics: string[];
  progression: Progression;
  excludeSolved: boolean;
  excludeAttempted: boolean;
  bookmarks: StoredBookmark[];
  sheets: StoredSheet[];
}

function matchesFilters(
  p: ContestProblem,
  args: BuildArgs,
  excludeKeys: Set<string>,
): boolean {
  if (excludeKeys.has(p.key)) return false;
  if (p.rating == null) return false;
  if (p.rating < args.minRating || p.rating > args.maxRating) return false;
  if (args.topics.length > 0 && !args.topics.some((t) => p.tags.includes(t))) return false;
  return true;
}

function applyProgression(
  pool: ContestProblem[],
  n: number,
  progression: Progression,
): ContestProblem[] {
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  if (progression === "flat") {
    return shuffled.slice(0, n);
  }
  if (progression === "ascending") {
    // pick n and sort by rating ascending
    return shuffled.slice(0, n).sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
  }
  // wave: easy -> hard -> medium mix
  const picked = shuffled.slice(0, n).sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
  const wave: ContestProblem[] = [];
  let lo = 0;
  let hi = picked.length - 1;
  let turn = 0;
  while (lo <= hi) {
    if (turn % 2 === 0) wave.push(picked[lo++]);
    else wave.push(picked[hi--]);
    turn++;
  }
  return wave;
}

async function buildContestProblems(args: BuildArgs): Promise<ContestProblem[]> {
  const excludeKeys = new Set<string>();

  // Merge exclusion sets
  if (args.source === "handle" && args.handle && (args.excludeSolved || args.excludeAttempted)) {
    const set = args.excludeAttempted
      ? await fetchAttemptedForHandle(args.handle)
      : await fetchSolvedForHandle(args.handle);
    set.forEach((k) => excludeKeys.add(k));
  } else if (args.excludeSolved || args.excludeAttempted) {
    // use cached solved handles from localStorage (any handle the user has looked up)
    try {
      const raw = localStorage.getItem(SOLVED_HANDLES_KEY);
      if (raw) {
        const map = JSON.parse(raw) as Record<string, string[]>;
        Object.values(map).forEach((arr) => arr.forEach((k) => excludeKeys.add(k)));
      }
    } catch {
      /* ignore */
    }
  }

  let pool: ContestProblem[] = [];

  if (args.source === "sheet") {
    const sheet = args.sheets.find((s) => s.id === args.sheetId);
    pool = (sheet?.problems ?? []).filter((p) => matchesFilters(p, args, excludeKeys));
  } else if (args.source === "bookmarks") {
    pool = args.bookmarks
      .map<ContestProblem>((b) => {
        const [c, i] = b.problemKey.split("-");
        const contestId = Number(c);
        return {
          key: b.problemKey,
          contestId: Number.isFinite(contestId) ? contestId : null,
          index: i ?? "",
          name: b.name,
          rating: b.rating,
          tags: b.tags,
          url: b.url,
        };
      })
      .filter((p) => matchesFilters(p, args, excludeKeys));
  } else if (args.source === "handle") {
    // Realistic contest inspired by handle's solve history:
    // fetch their solved set, then pull recent problems near their skill range from problemset.
    const solved = await fetchSolvedForHandle(args.handle);
    const all = await fetchProblemset();
    // topic profile from their solves
    const topicCount: Record<string, number> = {};
    for (const p of all) {
      if (solved.has(p.key)) p.tags.forEach((t) => (topicCount[t] = (topicCount[t] ?? 0) + 1));
    }
    const topTopics = Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([t]) => t);
    pool = all.filter((p) => {
      if (excludeKeys.has(p.key)) return false;
      if (p.rating == null) return false;
      if (p.rating < args.minRating || p.rating > args.maxRating) return false;
      // topic weighting: prefer overlaps with their profile
      const topicOK =
        args.topics.length > 0
          ? args.topics.some((t) => p.tags.includes(t))
          : topTopics.length === 0 || p.tags.some((t) => topTopics.includes(t));
      return topicOK;
    });
  } else {
    // "ai" random from full problemset
    const all = await fetchProblemset();
    pool = all.filter((p) => matchesFilters(p, args, excludeKeys));
  }

  return applyProgression(pool, args.numProblems, args.progression);
}

/* ============================================================
 * PAGE
 * ============================================================ */

function CustomContestPage() {
  const navigate = useNavigate();
  const requireAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.message("Please sign in to continue.");
      navigate({ to: "/auth", search: { redirect: "/simulator" } as never });
      return false;
    }
    return true;
  };
  // form state
  const [name, setName] = useState("");
  const [source, setSource] = useState<Source>("ai");
  const [handle, setHandle] = useState("");
  const [sheetId, setSheetId] = useState<string>("");
  const [numProblems, setNumProblems] = useState(6);
  const [minRating, setMinRating] = useState(1200);
  const [maxRating, setMaxRating] = useState(1800);
  const [topics, setTopics] = useState<string[]>([]);
  const [durationMin, setDurationMin] = useState(120);
  const [progression, setProgression] = useState<Progression>("ascending");
  const [excludeSolved, setExcludeSolved] = useState(false);
  const [excludeAttempted, setExcludeAttempted] = useState(false);

  // data
  const [bookmarks, setBookmarks] = useState<StoredBookmark[]>([]);
  const sheetsQ = useActiveSheets();
  const sheets = useMemo<StoredSheet[]>(
    () =>
      (sheetsQ.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        problems: (s.problems ?? []).map((p) => ({
          key: p.key,
          contestId: p.contestId,
          index: p.index,
          name: p.name,
          rating: p.rating,
          tags: p.tags,
          url: p.url,
        })),
      })),
    [sheetsQ.data],
  );
  const [saved, setSaved] = useState<SavedContest[]>([]);

  // build state
  const [building, setBuilding] = useState(false);
  const [preview, setPreview] = useState<ContestProblem[] | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);

  // live state (once a contest is started)
  const [running, setRunning] = useState<SavedContest | null>(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem(BOOKMARKS_KEY);
      if (b) setBookmarks(JSON.parse(b));
      const c = localStorage.getItem(SAVED_CONTESTS_KEY);
      if (c) setSaved(JSON.parse(c));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTopic = (t: string) => {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const args = (): BuildArgs => ({
    source,
    handle: handle.trim(),
    sheetId,
    numProblems,
    minRating,
    maxRating,
    topics,
    progression,
    excludeSolved,
    excludeAttempted,
    bookmarks,
    sheets,
  });

  const generate = async () => {
    if (!(await requireAuth())) return;
    setBuilding(true);
    setBuildError(null);
    setPreview(null);
    toast.loading("Fetching problems from Codeforces…", { id: "gen" });
    try {
      const problems = await buildContestProblems(args());
      if (problems.length === 0) {
        setBuildError("No problems matched. Widen rating, topics, or change source.");
        toast.error("No problems matched your filters.", { id: "gen" });
      } else {
        toast.success(`Built ${problems.length} problems.`, { id: "gen" });
      }
      setPreview(problems);
      setTimeout(() => {
        document
          .getElementById("contest-preview")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to build contest";
      setBuildError(msg);
      toast.error(msg, { id: "gen" });
    } finally {
      setBuilding(false);
    }
  };


  const buildSavedRecord = (problems: ContestProblem[]): SavedContest => ({
    id: crypto.randomUUID(),
    name: name.trim() || defaultName(source, handle),
    source,
    handle: source === "handle" ? handle.trim() : undefined,
    sheetId: source === "sheet" ? sheetId : undefined,
    numProblems: problems.length,
    minRating,
    maxRating,
    topics,
    durationMin,
    progression,
    excludeSolved,
    problems,
    createdAt: Date.now(),
  });

  const persistSaved = (next: SavedContest[]) => {
    setSaved(next);
    try {
      localStorage.setItem(SAVED_CONTESTS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const saveForLater = async () => {
    if (!(await requireAuth())) return;
    let problems = preview;
    if (!problems) {
      setBuilding(true);
      try {
        problems = await buildContestProblems(args());
        setPreview(problems);
      } catch (e) {
        setBuildError(e instanceof Error ? e.message : "Failed to build contest");
        setBuilding(false);
        return;
      }
      setBuilding(false);
    }
    if (!problems || problems.length === 0) {
      toast.error("Nothing to save — generate a valid contest first.");
      return;
    }
    const rec = buildSavedRecord(problems);
    persistSaved([rec, ...saved]);
    toast.success(`Saved "${rec.name}"`);
  };

  const startNow = async () => {
    if (!(await requireAuth())) return;
    let problems = preview;
    if (!problems) {
      setBuilding(true);
      try {
        problems = await buildContestProblems(args());
        setPreview(problems);
      } catch (e) {
        setBuildError(e instanceof Error ? e.message : "Failed to build contest");
        setBuilding(false);
        return;
      }
      setBuilding(false);
    }
    if (!problems || problems.length === 0) {
      toast.error("No problems to run.");
      return;
    }
    const rec = buildSavedRecord(problems);
    persistSaved([rec, ...saved]);
    setRunning(rec);
  };

  const startSaved = (c: SavedContest) => setRunning(c);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteSaved = (id: string) => {
    persistSaved(saved.filter((c) => c.id !== id));
    toast.success("Contest deleted");
    setConfirmDeleteId(null);
  };


  if (running) {
    return <LiveContest contest={running} onExit={() => setRunning(null)} />;
  }

  return (
    <AppShell breadcrumb={[{ label: "Practice" }, { label: "Custom Contest" }]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-muted/60 px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
            <Sparkles className="size-3 text-primary" /> Custom contest builder
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Design your own contest, then run it live.
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Pull problems from AI-picked mix, a saved sheet, your bookmarks, or any Codeforces
            handle's solving history. Tune rating, topics, duration, and difficulty progression.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {/* Name */}
            <FieldCard title="Contest name" hint="Optional — we'll auto-generate one if empty.">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={defaultName(source, handle)}
              />
            </FieldCard>

            {/* Source */}
            <FieldCard title="Problem source">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { id: "ai", label: "AI Mix", icon: Sparkles, hint: "From CF problemset" },
                    { id: "sheet", label: "Sheet", icon: BookMarked, hint: `${sheets.length} saved` },
                    { id: "bookmarks", label: "Bookmarks", icon: Tag, hint: `${bookmarks.length} saved` },
                    { id: "handle", label: "CF Handle", icon: Users, hint: "Inspired by user" },
                  ] as const
                ).map((s) => {
                  const active = source === s.id;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSource(s.id)}
                      className={cn(
                        "rounded-md border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border/70 hover:border-border",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-primary" />
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <p className="mt-1 text-2xs text-muted-foreground">{s.hint}</p>
                    </button>
                  );
                })}
              </div>

              {source === "handle" ? (
                <div className="mt-3">
                  <Label className="text-2xs uppercase tracking-[0.14em] text-muted-foreground">
                    Codeforces handle
                  </Label>
                  <Input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="tourist"
                    className="mt-1"
                  />
                  <p className="mt-1 text-2xs text-muted-foreground">
                    We'll analyze this user's solved problems and build a contest tuned to their
                    topics and rating range.
                  </p>
                </div>
              ) : null}

              {source === "sheet" ? (
                <div className="mt-3">
                  <Label className="text-2xs uppercase tracking-[0.14em] text-muted-foreground">
                    Pick a sheet
                  </Label>
                  {sheets.length === 0 ? (
                    <p className="mt-2 rounded-md border border-dashed border-border/70 p-3 text-2xs text-muted-foreground">
                      No saved sheets yet. Create one from{" "}
                      <Link to="/cheatsheets" className="text-primary underline">
                        Sheets
                      </Link>
                      .
                    </p>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      {sheets.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSheetId(s.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors",
                            sheetId === s.id
                              ? "border-primary bg-primary/5"
                              : "border-border/70 hover:border-border",
                          )}
                        >
                          <span className="truncate font-medium">{s.name}</span>
                          <span className="font-mono text-2xs text-muted-foreground">
                            {s.problems?.length ?? 0} problems
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {source === "bookmarks" && bookmarks.length === 0 ? (
                <p className="mt-3 rounded-md border border-dashed border-border/70 p-3 text-2xs text-muted-foreground">
                  No bookmarks yet. Bookmark problems from any sheet to use them here.
                </p>
              ) : null}
            </FieldCard>

            {/* Number of problems */}
            <FieldCard title="Number of problems">
              <div className="flex items-center justify-between">
                <Slider
                  value={[numProblems]}
                  min={2}
                  max={12}
                  step={1}
                  onValueChange={(v) => setNumProblems(v[0])}
                  className="flex-1"
                />
                <span className="ml-4 font-mono text-xl font-semibold tabular-nums">
                  {numProblems}
                </span>
              </div>
            </FieldCard>

            {/* Rating range */}
            <FieldCard
              title="Rating range"
              right={
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {minRating} – {maxRating}
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-2xs text-muted-foreground">Min</Label>
                  <Slider
                    value={[minRating]}
                    min={800}
                    max={3500}
                    step={100}
                    onValueChange={(v) => {
                      const nv = v[0];
                      setMinRating(nv);
                      if (nv > maxRating) setMaxRating(nv);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-2xs text-muted-foreground">Max</Label>
                  <Slider
                    value={[maxRating]}
                    min={800}
                    max={3500}
                    step={100}
                    onValueChange={(v) => {
                      const nv = v[0];
                      setMaxRating(nv);
                      if (nv < minRating) setMinRating(nv);
                    }}
                  />
                </div>
              </div>
            </FieldCard>

            {/* Topics */}
            <FieldCard
              title="Topics"
              hint="Leave empty to allow all topics."
              right={
                topics.length > 0 ? (
                  <button
                    onClick={() => setTopics([])}
                    className="text-2xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                ) : null
              }
            >
              <div className="flex flex-wrap gap-1.5">
                {CF_TOPICS.map((t) => {
                  const active = topics.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTopic(t)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-2xs transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </FieldCard>

            {/* Duration */}
            <FieldCard title="Duration">
              <div className="grid grid-cols-4 gap-2">
                {[60, 90, 120, 150].map((m) => (
                  <button
                    key={m}
                    onClick={() => setDurationMin(m)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-center transition-colors",
                      durationMin === m
                        ? "border-primary bg-primary/5"
                        : "border-border/70 hover:border-border",
                    )}
                  >
                    <div className="font-mono text-base font-semibold">{m}m</div>
                  </button>
                ))}
              </div>
            </FieldCard>

            {/* Progression */}
            <FieldCard title="Difficulty progression">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "flat", label: "Flat", hint: "Random order" },
                    { id: "ascending", label: "Ascending", hint: "Easy → hard" },
                    { id: "wave", label: "Wave", hint: "Easy, hard, medium" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProgression(p.id)}
                    className={cn(
                      "rounded-md border p-3 text-left transition-colors",
                      progression === p.id
                        ? "border-primary bg-primary/5"
                        : "border-border/70 hover:border-border",
                    )}
                  >
                    <div className="text-sm font-medium">{p.label}</div>
                    <p className="text-2xs text-muted-foreground">{p.hint}</p>
                  </button>
                ))}
              </div>
            </FieldCard>

            {/* Exclusions */}
            <FieldCard title="Exclusions">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Exclude solved</p>
                    <p className="text-2xs text-muted-foreground">
                      Skip problems already solved{source === "handle" ? " by this handle" : ""}.
                    </p>
                  </div>
                  <Switch checked={excludeSolved} onCheckedChange={setExcludeSolved} />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Exclude attempted</p>
                    <p className="text-2xs text-muted-foreground">
                      Also skip problems attempted but not solved.
                    </p>
                  </div>
                  <Switch checked={excludeAttempted} onCheckedChange={setExcludeAttempted} />
                </label>
              </div>
            </FieldCard>

            {/* Preview */}
            {building ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Building your contest…
              </div>
            ) : null}
            {buildError ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3 text-sm text-rose-500">
                {buildError}
              </div>
            ) : null}
            {preview && preview.length > 0 ? (
              <div id="contest-preview" className="rounded-lg border border-border/70 bg-card scroll-mt-4">

                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Preview</p>
                    <p className="text-2xs text-muted-foreground">
                      {preview.length} problems · {durationMin} min
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="border-0 bg-primary/10 font-mono text-2xs text-primary"
                  >
                    READY
                  </Badge>
                </div>
                <ul className="divide-y divide-border/60">
                  {preview.map((p, i) => (
                    <li
                      key={p.key}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3"
                    >
                      <span className="grid size-8 place-items-center rounded-md bg-surface-muted font-mono text-sm font-semibold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="truncate text-2xs text-muted-foreground">
                          <span className="font-mono">{p.key}</span> ·{" "}
                          {p.tags.slice(0, 3).join(", ")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-mono text-xs tabular-nums",
                          ratingColor(p.rating ?? 0),
                        )}
                      >
                        {p.rating ?? "?"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="size-4 text-primary" />
                <p className="text-sm font-semibold">Actions</p>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={generate}
                  disabled={building || (source === "handle" && !handle.trim())}
                >
                  {building ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Shuffle className="size-4" />
                  )}
                  {building ? "Generating…" : "Generate preview"}
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={startNow}
                  disabled={building || (source === "handle" && !handle.trim())}
                >
                  <Play className="size-4" fill="currentColor" /> Start now
                </Button>
                <Button
                  className="w-full gap-2"
                  variant="ghost"
                  onClick={saveForLater}
                  disabled={building || (source === "handle" && !handle.trim())}
                >
                  <Save className="size-4" /> Save for later
                </Button>
              </div>
            </div>

            {saved.length > 0 ? (
              <div className="rounded-lg border border-border/70 bg-card">
                <div className="border-b border-border/60 px-4 py-3">
                  <p className="text-sm font-semibold">Saved contests</p>
                  <p className="text-2xs text-muted-foreground">{saved.length} ready to run</p>
                </div>
                <ul className="divide-y divide-border/60">
                  {saved.map((c) => (
                    <li key={c.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="truncate text-2xs text-muted-foreground">
                            {c.problems.length} · {c.durationMin}m · {c.minRating}-{c.maxRating}
                          </p>
                        </div>
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          className="text-muted-foreground hover:text-rose-500"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      {confirmDeleteId === c.id ? (
                        <div className="mt-2 rounded-md border border-border/70 bg-surface-muted/40 p-3">
                          <p className="text-xs text-foreground">
                            Delete <span className="font-semibold">{c.name}</span>?
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => deleteSaved(c.id)}
                            >
                              Yes 😢
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              No 😊
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => startSaved(c)}
                        >
                          <Play className="size-3" fill="currentColor" /> Start
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================================
 * FIELD CARD
 * ============================================================ */

function FieldCard({
  title,
  hint,
  right,
  children,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {hint ? <p className="text-2xs text-muted-foreground">{hint}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
 * LIVE CONTEST
 * ============================================================ */

function LiveContest({ contest, onExit }: { contest: SavedContest; onExit: () => void }) {
  const totalSec = contest.durationMin * 60;
  const [elapsed, setElapsed] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, "solved" | "attempted" | "skipped">>({});
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e >= totalSec) {
          window.clearInterval(id);
          return totalSec;
        }
        return e + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [totalSec]);

  const active = contest.problems[activeIdx];
  const remaining = totalSec - elapsed;
  const solved = Object.values(statuses).filter((s) => s === "solved").length;

  const mark = (key: string, s: "solved" | "attempted" | "skipped") =>
    setStatuses((prev) => ({ ...prev, [key]: s }));

  return (
    <AppShell
      breadcrumb={[{ label: "Practice" }, { label: "Custom Contest" }, { label: contest.name }]}
      actions={
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onExit}>
          <X className="size-3.5" /> Exit
        </Button>
      }
    >
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 space-y-4">
        {/* Timer bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Clock className="size-4 text-primary" />
            <div>
              <p className="font-mono text-lg font-semibold tabular-nums">{formatTime(remaining)}</p>
              <p className="text-2xs text-muted-foreground">
                {solved}/{contest.problems.length} solved
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-2xs text-muted-foreground">
            <Target className="size-3" /> {contest.minRating}-{contest.maxRating} ·{" "}
            <TrendingUp className="size-3" /> {contest.progression}
          </div>
        </div>

        {/* Standings row */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${contest.problems.length}, minmax(0, 1fr))` }}
        >
          {contest.problems.map((p, i) => {
            const st = statuses[p.key];
            const isActive = i === activeIdx;
            return (
              <button
                key={p.key}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "rounded-md border p-2.5 text-left transition-colors",
                  isActive ? "border-primary bg-primary/5" : "border-border/70 hover:border-border",
                  st === "solved" && !isActive && "border-emerald-500/40 bg-emerald-500/5",
                  st === "attempted" && !isActive && "border-amber-500/40 bg-amber-500/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {st === "solved" ? (
                    <span className="text-2xs text-emerald-500">✓</span>
                  ) : st === "attempted" ? (
                    <span className="text-2xs text-amber-500">·</span>
                  ) : null}
                </div>
                <p className={cn("mt-1 font-mono text-2xs tabular-nums", ratingColor(p.rating ?? 0))}>
                  {p.rating ?? "?"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active problem */}
        {active ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-lg border border-border/70 bg-card">
              <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3">
                <span className="grid size-8 place-items-center rounded-md bg-surface-muted font-mono text-sm font-semibold">
                  {String.fromCharCode(65 + activeIdx)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{active.name}</p>
                  <p className="flex items-center gap-1.5 truncate text-2xs text-muted-foreground">
                    <span className="font-mono">{active.key}</span> ·{" "}
                    <span className={ratingColor(active.rating ?? 0)}>{active.rating ?? "?"}</span>{" "}
                    · {active.tags.slice(0, 4).join(", ")}
                  </p>
                </div>
                <a
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-2xs text-primary underline"
                >
                  Open on Codeforces
                </a>
              </div>
              <div className="p-6 text-sm text-muted-foreground">
                Open the problem on Codeforces, solve it in your editor, then mark your verdict
                below.
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-card p-4 space-y-2">
              <p className="text-sm font-semibold">Mark verdict</p>
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={() => mark(active.key, "solved")}
              >
                <span className="text-emerald-500">●</span> Solved
              </Button>
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={() => mark(active.key, "attempted")}
              >
                <span className="text-amber-500">●</span> Attempted (WA/TLE)
              </Button>
              <Button
                className="w-full justify-start gap-2"
                variant="ghost"
                onClick={() => mark(active.key, "skipped")}
              >
                Skip
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

/* ============================================================
 * HELPERS
 * ============================================================ */

function defaultName(source: Source, handle: string): string {
  if (source === "handle" && handle.trim()) return `Inspired by ${handle.trim()}`;
  if (source === "sheet") return "Sheet contest";
  if (source === "bookmarks") return "Bookmarks contest";
  return "AI custom contest";
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(mm)}:${pad(sec)}`;
  return `${pad(mm)}:${pad(sec)}`;
}

function ratingColor(r: number): string {
  if (r < 1200) return "text-muted-foreground";
  if (r < 1400) return "text-emerald-500";
  if (r < 1600) return "text-cyan-500";
  if (r < 1900) return "text-blue-500";
  if (r < 2100) return "text-violet-500";
  if (r < 2400) return "text-amber-500";
  return "text-rose-500";
}

// silence unused-import warnings for icons kept for future use
export const _icons = { Search };
