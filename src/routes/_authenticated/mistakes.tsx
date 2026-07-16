import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bug,
  ChevronRight,
  Compass,
  Copy,
  Filter,
  GitBranch,
  Lightbulb,
  Network,
  Repeat,
  Search,
  Shuffle,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ds/kbd";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mistakes")({
  head: () => ({
    meta: [
      { title: "Mistake Analyzer · Verdiqx" },
      {
        name: "description",
        content:
          "AI review of your wrong submissions — clustered by root cause, explained like a senior competitive programmer, with targeted drills.",
      },
      { property: "og:title", content: "Mistake Analyzer · Verdiqx" },
      {
        property: "og:description",
        content:
          "Understand why your submissions fail — not just that they failed. Every mistake gets a diagnosis and a fix plan.",
      },
    ],
  }),
  component: MistakesPage,
});

/* ============================================================
 * DATA
 * ============================================================ */

type ClusterId =
  | "impl"
  | "greedy"
  | "binsearch"
  | "dp"
  | "overflow"
  | "edge"
  | "offbyone"
  | "graph";

interface Cluster {
  id: ClusterId;
  label: string;
  Icon: typeof Bug;
  count: number;
  weekDelta: number; // negative = improving
  severity: "high" | "medium" | "low";
  blurb: string;
}

const CLUSTERS: Cluster[] = [
  {
    id: "impl",
    label: "Implementation",
    Icon: Bug,
    count: 34,
    weekDelta: -6,
    severity: "medium",
    blurb: "Careless coding under time pressure",
  },
  {
    id: "greedy",
    label: "Greedy Mistake",
    Icon: Zap,
    count: 21,
    weekDelta: +3,
    severity: "high",
    blurb: "Locally optimal ≠ globally optimal",
  },
  {
    id: "binsearch",
    label: "Binary Search Bug",
    Icon: Compass,
    count: 18,
    weekDelta: -2,
    severity: "medium",
    blurb: "Invariant on lo/hi drifted",
  },
  {
    id: "dp",
    label: "DP Transition",
    Icon: GitBranch,
    count: 26,
    weekDelta: +1,
    severity: "high",
    blurb: "State captures the wrong subproblem",
  },
  {
    id: "overflow",
    label: "Overflow",
    Icon: TrendingUp,
    count: 9,
    weekDelta: -4,
    severity: "low",
    blurb: "Missed int/long boundary",
  },
  {
    id: "edge",
    label: "Edge Cases",
    Icon: AlertTriangle,
    count: 29,
    weekDelta: 0,
    severity: "medium",
    blurb: "n=0, n=1, all-equal, max n",
  },
  {
    id: "offbyone",
    label: "Off-by-One",
    Icon: Repeat,
    count: 22,
    weekDelta: -3,
    severity: "low",
    blurb: "Half-open vs closed range confusion",
  },
  {
    id: "graph",
    label: "Graph Misunderstanding",
    Icon: Network,
    count: 14,
    weekDelta: +2,
    severity: "high",
    blurb: "Directed/undirected mismatch, or wrong model",
  },
];

interface Submission {
  id: string;
  problem: string;
  problemRating: number;
  cluster: ClusterId;
  verdict: string;
  submittedAt: string; // relative
  language: "cpp" | "python" | "java";
  code: string;
  annotations: Annotation[];
  rootCause: string;
  reviewer: string; // paragraph in senior-CP-voice
  fix: string;
  recommendations: Recommendation[];
  patterns: string[];
}

interface Annotation {
  line: number;
  kind: "bug" | "hint" | "risk";
  note: string;
}

interface Recommendation {
  kind: "drill" | "cheatsheet" | "problem";
  title: string;
  meta: string;
}

const SUBMISSIONS: Submission[] = [
  {
    id: "sub-9421",
    problem: "Aggressive Cows",
    problemRating: 1700,
    cluster: "binsearch",
    verdict: "Wrong Answer on test 7",
    submittedAt: "2h ago",
    language: "cpp",
    code: `bool ok(vector<int>& a, int n, int c, int d) {
  int cnt = 1, last = a[0];
  for (int i = 1; i < n; i++)
    if (a[i] - last >= d) { cnt++; last = a[i]; }
  return cnt >= c;
}

int solve(vector<int>& a, int c) {
  sort(a.begin(), a.end());
  int lo = 1, hi = a.back() - a[0];
  while (lo < hi) {
    int mid = (lo + hi) / 2;          // ← rounds down
    if (ok(a, a.size(), c, mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}`,
    annotations: [
      {
        line: 12,
        kind: "bug",
        note: "When searching for the maximum feasible value, `mid = (lo + hi) / 2` rounds toward lo. Combined with `lo = mid`, this loops forever whenever `hi - lo = 1`.",
      },
      {
        line: 13,
        kind: "hint",
        note: "This is the classic 'find the largest x such that ok(x)' pattern — the invariant flips vs. 'find the smallest'.",
      },
    ],
    rootCause:
      "Wrong binary-search template for a maximization predicate. You used the min-search skeleton but with a max-search assignment, so the loop never terminates on the boundary.",
    reviewer:
      "I've seen this exact bug from a lot of 1600-rated coders. The fix isn't 'add a +1 somewhere' — it's recognizing that binary search has *two* templates, mirror images of each other. Memorize both, label them 'first true' and 'last true', and always ask which one this problem needs *before* you start typing. The moment you catch yourself writing `lo = mid` with `mid = (lo+hi)/2`, stop — that combination is a loop.",
    fix: "Use `mid = lo + (hi - lo + 1) / 2` when the assignment is `lo = mid` (upper-rounded midpoint), or restructure the search as 'first index that fails' and return `answer - 1`. Both are safe.",
    recommendations: [
      {
        kind: "cheatsheet",
        title: "Binary Search — two templates side by side",
        meta: "5 min · visual",
      },
      { kind: "drill", title: "12-problem binary-search predicate drill", meta: "45 min · timed" },
      { kind: "problem", title: "Painter's Partition", meta: "CF 1600 · same pattern" },
    ],
    patterns: ["Parametric search", "Monotone predicate", "Max feasible value"],
  },
  {
    id: "sub-9418",
    problem: "Coin Change II",
    problemRating: 1500,
    cluster: "dp",
    verdict: "Wrong Answer on test 3",
    submittedAt: "yesterday",
    language: "cpp",
    code: `long long ways(int amount, vector<int>& coins) {
  vector<long long> dp(amount + 1, 0);
  dp[0] = 1;
  for (int a = 1; a <= amount; a++)        // ← amount outer
    for (int c : coins)
      if (a - c >= 0) dp[a] += dp[a - c];
  return dp[amount];
}`,
    annotations: [
      {
        line: 4,
        kind: "bug",
        note: "Amount in the outer loop counts every ordering of coins — so {1,2} and {2,1} both add. That's permutations, not combinations.",
      },
      {
        line: 6,
        kind: "hint",
        note: "Coin in the outer loop enforces an order on coin choice, which is exactly what removes duplicate combinations.",
      },
    ],
    rootCause:
      "Loop order confused. This is the 'unbounded knapsack combinations vs. permutations' trap — the transition is identical, only the loop nesting distinguishes them.",
    reviewer:
      "The DP recurrence is right. The loop order is the entire problem. If you find yourself unsure which loop goes outside, mentally trace it on `coins = [1, 2]`, `amount = 3` — you should see exactly 2 combinations {1,1,1} and {1,2}, not 3. Whenever the answer is ~2× what it should be on a small case, suspect this bug first.",
    fix: "Swap the loops: iterate coins outside, amount inside. Same array, same recurrence, correct semantics.",
    recommendations: [
      { kind: "cheatsheet", title: "Knapsack loop-order decision tree", meta: "3 min · visual" },
      { kind: "drill", title: "Coin Change I / II / permutations trio", meta: "30 min" },
      { kind: "problem", title: "Combination Sum IV", meta: "LC · same trap, reversed" },
    ],
    patterns: ["Unbounded knapsack", "Combinations vs. permutations"],
  },
  {
    id: "sub-9412",
    problem: "Max Subarray Sum",
    problemRating: 1200,
    cluster: "edge",
    verdict: "Wrong Answer on test 5",
    submittedAt: "2 days ago",
    language: "cpp",
    code: `int maxSub(vector<int>& a) {
  int best = 0, cur = 0;              // ← best starts at 0
  for (int x : a) {
    cur = max(x, cur + x);
    best = max(best, cur);
  }
  return best;
}`,
    annotations: [
      {
        line: 2,
        kind: "bug",
        note: "Initializing `best = 0` assumes the empty subarray is valid — but the problem requires at least one element. Fails on all-negative arrays.",
      },
    ],
    rootCause:
      "Edge-case miss: all-negative input. The algorithm is Kadane's, correct in spirit — the initialization silently changed the problem definition.",
    reviewer:
      "Kadane's is a two-line algorithm, so the bugs are almost always in *setup*. Initialize `best` to `a[0]` (or `INT_MIN`), and `cur` to 0 or `a[0]` depending on whether you're allowing empty subarrays. Read the problem line 'subarray of length ≥ 1' out loud before you code — it changes the initialization.",
    fix: "Set `best = a[0]` and start iteration from index 1, or initialize `best = INT_MIN`.",
    recommendations: [
      {
        kind: "cheatsheet",
        title: "Edge case checklist: n=1, all-neg, all-same, max n",
        meta: "2 min",
      },
      { kind: "drill", title: "Kadane's variants (5 problems)", meta: "25 min" },
    ],
    patterns: ["Kadane's", "Empty vs. non-empty subarray"],
  },
];

/* ============================================================
 * PAGE
 * ============================================================ */

function MistakesPage() {
  const [selectedId, setSelectedId] = useState<string>(SUBMISSIONS[0].id);
  const [activeCluster, setActiveCluster] = useState<ClusterId | "all">("all");
  const [query, setQuery] = useState("");

  const selected = SUBMISSIONS.find((s) => s.id === selectedId)!;

  const filtered = useMemo(
    () =>
      SUBMISSIONS.filter(
        (s) =>
          (activeCluster === "all" || s.cluster === activeCluster) &&
          (!query.trim() || s.problem.toLowerCase().includes(query.toLowerCase())),
      ),
    [activeCluster, query],
  );

  const totals = useMemo(() => {
    const total = CLUSTERS.reduce((s, c) => s + c.count, 0);
    const top = [...CLUSTERS].sort((a, b) => b.count - a.count)[0];
    const improving = CLUSTERS.filter((c) => c.weekDelta < 0).length;
    return { total, top, improving };
  }, []);

  return (
    <AppShell
      breadcrumb={[{ label: "Mistake Analyzer" }]}
      actions={
        <Button size="sm" className="gap-1.5">
          <Sparkles className="size-3.5" />
          Analyze new submission
        </Button>
      }
    >
      <div className="grid h-[calc(100dvh-var(--app-header-h,3.5rem))] grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)_22rem]">
        {/* ── Left: cluster list ─────────────────────────────── */}
        <aside className="hidden overflow-y-auto border-r border-border/60 bg-surface/40 lg:block">
          <div className="border-b border-border/60 p-5">
            <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-muted-foreground">
              <span className="inline-flex size-1.5 rounded-full bg-primary" />
              AI review · this month
            </div>
            <h1 className="mt-2 font-display text-xl font-semibold tracking-tight">
              Mistake Analyzer
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {totals.total} wrong submissions clustered by root cause.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat
                label="Top cluster"
                value={totals.top.label}
                sub={`${totals.top.count} subs`}
              />
              <MiniStat
                label="Improving"
                value={`${totals.improving}/${CLUSTERS.length}`}
                sub="clusters ↓ this week"
              />
            </div>
          </div>

          <div className="p-3">
            <div className="mb-2 flex items-center justify-between px-2 text-2xs uppercase tracking-widest text-muted-foreground">
              <span>Clusters</span>
              <Filter className="size-3" />
            </div>
            <button
              onClick={() => setActiveCluster("all")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
                activeCluster === "all"
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:bg-surface/60 hover:text-foreground",
              )}
            >
              <span className="font-medium">All mistakes</span>
              <span className="tabular-nums">{totals.total}</span>
            </button>
            <div className="mt-1 space-y-0.5">
              {CLUSTERS.map((c) => (
                <ClusterRow
                  key={c.id}
                  cluster={c}
                  active={activeCluster === c.id}
                  onClick={() => setActiveCluster(c.id)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ── Center: submission list + review ───────────────── */}
        <section className="flex min-w-0 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b border-border/60 bg-background/60 px-4 py-2.5 backdrop-blur">
            <div className="relative min-w-0 flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by problem…"
                className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 text-2xs text-muted-foreground">
              <span className="tabular-nums">{filtered.length}</span>
              <span>submissions</span>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]">
            {/* Submission list */}
            <div className="hidden overflow-y-auto border-r border-border/60 md:block">
              {filtered.map((s) => (
                <SubmissionRow
                  key={s.id}
                  submission={s}
                  active={s.id === selectedId}
                  onClick={() => setSelectedId(s.id)}
                />
              ))}
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No submissions in this cluster.
                </div>
              ) : null}
            </div>

            {/* Review */}
            <div className="min-w-0 overflow-y-auto">
              <SubmissionReview submission={selected} />
            </div>
          </div>
        </section>

        {/* ── Right: recommendations ─────────────────────────── */}
        <aside className="hidden overflow-y-auto border-l border-border/60 bg-background lg:block">
          <RecommendationsPanel submission={selected} />
        </aside>
      </div>
    </AppShell>
  );
}

/* ============================================================
 * CLUSTER + SUBMISSION ROWS
 * ============================================================ */

function ClusterRow({
  cluster,
  active,
  onClick,
}: {
  cluster: Cluster;
  active: boolean;
  onClick: () => void;
}) {
  const { Icon, label, count, weekDelta, blurb, severity } = cluster;
  const trending = weekDelta === 0 ? null : weekDelta > 0 ? "up" : "down";
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors",
        active ? "bg-surface" : "hover:bg-surface/60",
      )}
    >
      <div
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border",
          severity === "high"
            ? "border-warning/30 bg-warning/10 text-warning"
            : severity === "medium"
              ? "border-border bg-surface text-foreground"
              : "border-border/60 bg-surface text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium">{label}</span>
          <span className="tabular-nums text-2xs text-muted-foreground">{count}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
          {trending ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 tabular-nums",
                trending === "down" ? "text-success" : "text-warning",
              )}
            >
              {trending === "down" ? (
                <TrendingDown className="size-3" />
              ) : (
                <TrendingUp className="size-3" />
              )}
              {Math.abs(weekDelta)}
            </span>
          ) : (
            <span className="text-muted-foreground">flat</span>
          )}
          <span className="truncate">· {blurb}</span>
        </div>
      </div>
    </button>
  );
}

function SubmissionRow({
  submission,
  active,
  onClick,
}: {
  submission: Submission;
  active: boolean;
  onClick: () => void;
}) {
  const cluster = CLUSTERS.find((c) => c.id === submission.cluster)!;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full items-start gap-3 border-b border-border/40 px-3 py-3 text-left transition-colors",
        active ? "bg-surface" : "hover:bg-surface/50",
      )}
    >
      {active ? (
        <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-primary" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{submission.problem}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
          <span className="tabular-nums">{submission.problemRating}</span>
          <span>·</span>
          <span>{submission.submittedAt}</span>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface px-2 py-0.5 text-2xs">
          <cluster.Icon className="size-3 text-muted-foreground" />
          {cluster.label}
        </div>
      </div>
      <ChevronRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
}

/* ============================================================
 * REVIEW
 * ============================================================ */

function SubmissionReview({ submission }: { submission: Submission }) {
  const cluster = CLUSTERS.find((c) => c.id === submission.cluster)!;
  const lines = submission.code.split("\n");
  const annByLine = new Map<number, Annotation>();
  submission.annotations.forEach((a) => annByLine.set(a.line, a));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5 md:p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-muted-foreground">
          <cluster.Icon className="size-3" />
          {cluster.label}
          <span className="text-border">·</span>
          <span className="text-destructive">{submission.verdict}</span>
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {submission.problem}
        </h2>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">Rating {submission.problemRating}</span>
          <span>·</span>
          <span>submitted {submission.submittedAt}</span>
          <span>·</span>
          <span className="uppercase">{submission.language}</span>
        </div>
      </div>

      {/* Root cause card */}
      <div className="relative overflow-hidden rounded-xl border border-warning/25 bg-warning/5 p-5">
        <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-warning">
          <AlertTriangle className="size-3" />
          Root cause
        </div>
        <div className="mt-2 text-sm font-medium leading-relaxed text-foreground">
          {submission.rootCause}
        </div>
      </div>

      {/* Code with annotations */}
      <Section
        title="Your submission"
        hint={
          <button className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground">
            <Copy className="size-3" />
            Copy
          </button>
        }
      >
        <div className="overflow-hidden rounded-lg border border-border/60 bg-surface-sunken font-mono text-xs">
          <div className="divide-y divide-border/40">
            {lines.map((line, i) => {
              const n = i + 1;
              const ann = annByLine.get(n);
              return (
                <div key={n}>
                  <div className={cn("flex", ann && "bg-warning/5")}>
                    <div className="w-10 shrink-0 select-none border-r border-border/40 px-2 py-1 text-right text-muted-foreground/70 tabular-nums">
                      {n}
                    </div>
                    <pre className="whitespace-pre-wrap break-words px-3 py-1 text-foreground/90">
                      {line || " "}
                    </pre>
                  </div>
                  {ann ? (
                    <div className="flex border-t border-warning/20 bg-warning/5">
                      <div className="w-10 shrink-0 border-r border-warning/20 px-2 py-2 text-right">
                        <span
                          className={cn(
                            "inline-block size-1.5 rounded-full",
                            ann.kind === "bug"
                              ? "bg-destructive"
                              : ann.kind === "risk"
                                ? "bg-warning"
                                : "bg-info",
                          )}
                        />
                      </div>
                      <div className="flex-1 px-3 py-2 font-sans text-xs leading-relaxed text-foreground/90">
                        <span
                          className={cn(
                            "mr-2 inline-flex items-center rounded-sm px-1 py-0.5 text-2xs font-medium uppercase tracking-wider",
                            ann.kind === "bug"
                              ? "bg-destructive/10 text-destructive"
                              : ann.kind === "risk"
                                ? "bg-warning/10 text-warning"
                                : "bg-info/10 text-info",
                          )}
                        >
                          {ann.kind}
                        </span>
                        {ann.note}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Senior reviewer voice */}
      <Section title="Senior reviewer notes" icon={<Sparkles className="size-3 text-primary" />}>
        <div className="rounded-xl border border-border/60 bg-surface/40 p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full border border-border/60 bg-background text-foreground">
              <span className="text-2xs font-semibold">AR</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">
                Verdiqx Review · trained on 40k+ CF submissions
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {submission.reviewer}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Fix */}
      <Section title="The fix" icon={<Lightbulb className="size-3 text-info" />}>
        <div className="rounded-lg border border-info/25 bg-info/5 p-4 text-sm leading-relaxed text-foreground/90">
          {submission.fix}
        </div>
      </Section>

      {/* Patterns */}
      <Section title="Underlying patterns">
        <div className="flex flex-wrap gap-1.5">
          {submission.patterns.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface px-2.5 py-1 text-xs"
            >
              <Shuffle className="size-3 text-muted-foreground" />
              {p}
            </span>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ============================================================
 * RIGHT PANEL
 * ============================================================ */

function RecommendationsPanel({ submission }: { submission: Submission }) {
  const iconFor = (k: Recommendation["kind"]) =>
    k === "cheatsheet" ? BookOpen : k === "drill" ? Target : Compass;
  const labelFor = (k: Recommendation["kind"]) =>
    k === "cheatsheet" ? "Cheat sheet" : k === "drill" ? "Drill" : "Problem";
  return (
    <div className="space-y-6 p-5">
      <div>
        <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-muted-foreground">
          <Sparkles className="size-3 text-primary" />
          Learning plan
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold">Fix this mistake for good</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Curated by the mistake cluster, sequenced from theory → drill → real problem.
        </p>
      </div>

      <div className="space-y-2">
        {submission.recommendations.map((r, i) => {
          const Icon = iconFor(r.kind);
          return (
            <button
              key={i}
              className="group flex w-full items-start gap-3 rounded-lg border border-border/60 bg-background p-3 text-left transition-colors hover:border-border hover:bg-surface/40"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-md border border-border/60 bg-surface">
                <Icon className="size-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-2xs uppercase tracking-widest text-muted-foreground">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>·</span>
                  <span>{labelFor(r.kind)}</span>
                </div>
                <div className="mt-0.5 truncate text-sm font-medium">{r.title}</div>
                <div className="mt-0.5 truncate text-2xs text-muted-foreground">{r.meta}</div>
              </div>
              <ArrowRight className="mt-1 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-primary">
          <Zap className="size-3" />
          Weekly forecast
        </div>
        <p className="mt-2 text-sm leading-relaxed">
          Fixing this cluster is worth an estimated{" "}
          <span className="font-semibold tabular-nums">+40 rating</span> over your next 20 contests
          based on similar users.
        </p>
        <div className="mt-3 flex items-center gap-2 text-2xs text-muted-foreground">
          Confidence: high · sample n = 1,240
        </div>
      </div>

      <div className="border-t border-border/60 pt-4 text-2xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Re-analyze</span>
          <Kbd>R</Kbd>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Ask Verdiqx about this</span>
          <Kbd>A</Kbd>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * PIECES
 * ============================================================ */

function Section({
  title,
  hint,
  icon,
  children,
}: {
  title: string;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-widest text-muted-foreground">
          {icon}
          {title}
        </div>
        {hint}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <div className="text-2xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-display text-sm font-semibold">{value}</div>
      <div className="mt-0.5 truncate text-2xs text-muted-foreground">{sub}</div>
    </div>
  );
}
