import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  Compass,
  Download,
  ExternalLink,
  Flame,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { useCreateSheet } from "@/hooks/use-sheets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Kbd } from "@/components/ds/kbd";
import { cn } from "@/lib/utils";
import {
  getCodeforcesJourney,
  type CFJourney,
  type CFSolvedProblem,
} from "@/lib/cf-dashboard.functions";

export const Route = createFileRoute("/problems")({
  head: () => ({
    meta: [
      { title: "CF Intelligence · Verdiqy" },
      {
        name: "description",
        content:
          "Enter any Codeforces handle and instantly generate a structured practice journey from their solving history — profile, analytics, AI insights, and importable practice sheets.",
      },
      { property: "og:title", content: "Codeforces Intelligence · Verdiqy" },
      {
        property: "og:description",
        content:
          "Turn any Codeforces profile into a personalised practice journey — solved history, topic mastery, and AI-generated sheets.",
      },
    ],
  }),
  component: ProblemsPage,
});

/* ============================================================
 * CONSTANTS
 * ============================================================ */

const FEATURED_HANDLES = ["tourist", "Benq", "Petr", "Gennady", "Um_nik", "ecnerwala"];
const HISTORY_KEY = "vq.cf.searchHistory";
const CACHE_KEY = (h: string) => `vq.cf.journey.${h.toLowerCase()}`;
const CACHE_TTL = 1000 * 60 * 30; // 30 min

type Tab = "overview" | "solved" | "analysis" | "compare" | "stats";

/* ============================================================
 * PAGE
 * ============================================================ */

function ProblemsPage() {
  const [query, setQuery] = useState("");
  const [handle, setHandle] = useState<string | null>(null);
  const [journey, setJourney] = useState<CFJourney | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [history, setHistory] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchJourney = useServerFn(getCodeforcesJourney);
  const mutation = useMutation({
    mutationFn: (h: string) => fetchJourney({ data: { handle: h } }),
    onSuccess: (data, h) => {
      setJourney(data);
      setHandle(h);
      setTab("overview");
      try {
        localStorage.setItem(
          CACHE_KEY(h),
          JSON.stringify({ data, at: Date.now() }),
        );
        const next = [h, ...history.filter((x) => x.toLowerCase() !== h.toLowerCase())].slice(0, 8);
        setHistory(next);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not load that handle";
      toast.error(msg);
    },
  });

  // Load history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  // Focus on mount
  useEffect(() => {
    if (!handle) inputRef.current?.focus();
  }, [handle]);

  const submit = (h: string, force = false) => {
    const clean = h.trim();
    if (!clean) return;
    if (!/^[A-Za-z0-9_.\-]{1,32}$/.test(clean)) {
      toast.error("That doesn't look like a valid Codeforces handle.");
      return;
    }
    if (force) {
      try {
        localStorage.removeItem(CACHE_KEY(clean));
      } catch {
        /* ignore */
      }
      const tId = toast.loading(`Refreshing ${clean}…`);
      mutation.mutate(clean, {
        onSuccess: () => toast.success(`Updated ${clean}`, { id: tId }),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Refresh failed",
            { id: tId },
          ),
      });
      return;
    }
    // Try cache first
    try {
      const raw = localStorage.getItem(CACHE_KEY(clean));
      if (raw) {
        const parsed = JSON.parse(raw) as { data: CFJourney; at: number };
        if (Date.now() - parsed.at < CACHE_TTL) {
          setJourney(parsed.data);
          setHandle(clean);
          setTab("overview");
          return;
        }
      }
    } catch {
      /* ignore */
    }
    mutation.mutate(clean);
  };



  return (
    <AppShell
      breadcrumb={[
        { label: "Codeforces Intelligence", to: "/problems" },
        ...(handle ? [{ label: handle }] : []),
      ]}
      actions={null}
    >
      {!journey ? (
        <SearchLanding
          query={query}
          setQuery={setQuery}
          onSubmit={submit}
          history={history}
          setHistory={setHistory}
          pending={mutation.isPending}
          inputRef={inputRef}
        />
      ) : (
        <JourneyView
          journey={journey}
          tab={tab}
          setTab={setTab}
          onOpenSheet={() => setSheetOpen(true)}
          onRefresh={() => handle && submit(handle, true)}
          refreshing={mutation.isPending}
          onChangeProfile={() => {
            setJourney(null);
            setHandle(null);
            setQuery("");
            setTab("overview");
          }}
        />

      )}

      <AnimatePresence>
        {sheetOpen && journey && (
          <PracticeSheetModal journey={journey} onClose={() => setSheetOpen(false)} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

/* ============================================================
 * SEARCH LANDING
 * ============================================================ */

function SearchLanding({
  query,
  setQuery,
  onSubmit,
  history,
  setHistory,
  pending,
  inputRef,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSubmit: (h: string) => void;
  history: string[];
  setHistory: (h: string[]) => void;
  pending: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--app-header-h,3.5rem))] w-full max-w-4xl flex-col items-center justify-start px-4 pt-16 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-2xs uppercase tracking-widest text-muted-foreground backdrop-blur"
      >
        <Sparkles className="size-3 text-primary" />
        Codeforces Intelligence
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="text-center font-display text-4xl font-semibold tracking-tight md:text-6xl"
      >
        Any handle. <span className="text-muted-foreground">A journey.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-4 max-w-xl text-center text-muted-foreground"
      >
        Type any Codeforces username. We turn their solving history into a structured
        practice journey — analytics, weak topics, and AI-generated sheets you can start today.
      </motion.p>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(query);
        }}
        className="relative mt-10 w-full max-w-2xl"
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/60 px-4 py-3 shadow-lg backdrop-blur transition-shadow",
            "focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]",
          )}
        >
          {pending ? (
            <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
          ) : (
            <Search className="size-5 shrink-0 text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any Codeforces handle…"
            disabled={pending}
            className="border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
            autoComplete="off"
            spellCheck={false}
          />
          {query && !pending ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          ) : null}
          <Button type="submit" size="sm" disabled={pending || !query.trim()} className="gap-1.5">
            Analyze <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between px-2 text-2xs text-muted-foreground">
          <span>
            Press <Kbd>Enter</Kbd> to generate the journey
          </span>
          <span>via public Codeforces API</span>
        </div>
      </motion.form>

      {/* Featured coders */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-10 w-full max-w-2xl"
      >
        <div className="mb-3 text-2xs font-medium uppercase tracking-widest text-muted-foreground">
          Try a legend
        </div>
        <div className="flex flex-wrap gap-2">
          {FEATURED_HANDLES.map((h) => (
            <button
              key={h}
              type="button"
              disabled={pending}
              onClick={() => {
                setQuery(h);
                onSubmit(h);
              }}
              className="group flex items-center gap-2 rounded-full border border-border/60 bg-surface/40 px-3 py-1.5 text-sm transition hover:border-primary/40 hover:bg-surface disabled:opacity-50"
            >
              <span className="font-medium">{h}</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground transition group-hover:text-primary" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-8 w-full max-w-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">
              Recent
            </div>
            <button
              type="button"
              onClick={clearHistory}
              className="text-2xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                key={h}
                type="button"
                disabled={pending}
                onClick={() => {
                  setQuery(h);
                  onSubmit(h);
                }}
                className="rounded-full border border-border/40 bg-transparent px-3 py-1 text-xs text-muted-foreground transition hover:border-border hover:text-foreground disabled:opacity-50"
              >
                {h}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Feature grid */}
      <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
        {[
          {
            icon: Activity,
            title: "Full analytics",
            body: "Rating chart, heatmap, topic distribution, contest timeline.",
          },
          {
            icon: Sparkles,
            title: "AI journey",
            body: "Atlas turns solved history into a personalised practice sheet.",
          },
          {
            icon: Compass,
            title: "Import & track",
            body: "Push the generated sheet into Today's Mission and track progress.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border/50 bg-surface/40 p-4 text-sm"
          >
            <f.icon className="mb-2 size-4 text-primary" />
            <div className="font-medium">{f.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{f.body}</div>
          </div>
        ))}
      </div>

      {pending && (
        <div className="mt-10 w-full max-w-3xl">
          <SearchSkeleton />
        </div>
      )}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

/* ============================================================
 * JOURNEY VIEW (post-search)
 * ============================================================ */

function JourneyView({
  journey,
  tab,
  setTab,
  onOpenSheet,
  onRefresh,
  refreshing,
  onChangeProfile,
}: {
  journey: CFJourney;
  tab: Tab;
  setTab: (t: Tab) => void;
  onOpenSheet: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onChangeProfile: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <ProfileHeader journey={journey} onOpenSheet={onOpenSheet} onRefresh={onRefresh} refreshing={refreshing} onChangeProfile={onChangeProfile} />


      <div className="sticky top-0 z-10 -mx-4 mt-6 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
        <div className="flex gap-1 overflow-x-auto">
          {(
            [
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "solved", label: "Solved Problems", icon: Trophy },
              { id: "analysis", label: "AI Analysis", icon: Sparkles },
              { id: "compare", label: "Compare", icon: Swords },
              { id: "stats", label: "Statistics", icon: Activity },
            ] as { id: Tab; label: string; icon: typeof BarChart3 }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm transition-colors",
                tab === t.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === "overview" && <OverviewTab journey={journey} />}
        {tab === "solved" && <SolvedTab journey={journey} />}
        {tab === "analysis" && <AnalysisTab journey={journey} />}
        {tab === "compare" && <CompareTab journey={journey} />}
        {tab === "stats" && <StatsTab journey={journey} />}
      </div>
    </div>
  );
}

/* ============================================================
 * PROFILE HEADER
 * ============================================================ */

const RANK_COLOR: Record<string, string> = {
  "legendary grandmaster": "text-red-500",
  "international grandmaster": "text-red-500",
  grandmaster: "text-red-500",
  "international master": "text-orange-500",
  master: "text-orange-500",
  "candidate master": "text-purple-500",
  expert: "text-blue-500",
  specialist: "text-cyan-500",
  pupil: "text-emerald-500",
  newbie: "text-muted-foreground",
  unrated: "text-muted-foreground",
};

function ProfileHeader({
  journey,
  onOpenSheet,
  onRefresh,
  refreshing,
  onChangeProfile,
}: {
  journey: CFJourney;
  onOpenSheet: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onChangeProfile: () => void;
}) {
  const { user, dashboard, fetchedAt } = journey;
  const rankColor = RANK_COLOR[user.rank.toLowerCase()] ?? "text-foreground";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const registered = new Date(user.registrationTimeSeconds * 1000);

  const lastActive = new Date(user.lastOnlineTimeSeconds * 1000);
  const FOLLOW_KEY = "cf:follows";
  const readFollows = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(FOLLOW_KEY) || "[]");
    } catch {
      return [];
    }
  };
  const [following, setFollowing] = useState(false);
  useEffect(() => {
    setFollowing(readFollows().includes(user.handle));
  }, [user.handle]);
  const toggleFollow = () => {
    const list = readFollows();
    const has = list.includes(user.handle);
    const next = has ? list.filter((h) => h !== user.handle) : [...list, user.handle];
    localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
    setFollowing(!has);
    window.dispatchEvent(new Event("cf:follows-changed"));
    toast.success(has ? `Unfollowed ${user.handle}` : `Following ${user.handle}`);
  };
  const share = async () => {
    const url = `${window.location.origin}/problems?h=${encodeURIComponent(user.handle)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-gradient-to-br from-surface/60 to-surface/20 p-5 md:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <img
            src={user.titlePhoto || user.avatar}
            alt={user.handle}
            className="size-16 rounded-full border-2 border-border object-cover md:size-20"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://userpic.codeforces.org/no-title.jpg`;
            }}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className={cn(
                  "font-display text-2xl font-semibold tracking-tight md:text-3xl",
                  rankColor,
                )}
              >
                {user.handle}
              </h1>
              <Badge variant="outline" className={cn("capitalize", rankColor)}>
                {user.rank}
              </Badge>
            </div>
            {fullName && (
              <div className="text-sm text-muted-foreground">{fullName}</div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
              {user.country && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {user.country}
                  {user.city ? `, ${user.city}` : ""}
                </span>
              )}
              {user.organization && (
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" /> {user.organization}
                </span>
              )}
              <span>Joined {registered.toLocaleDateString(undefined, { year: "numeric", month: "short" })}</span>
              <span>Last active {relativeTime(lastActive)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={onChangeProfile}
          >
            <Search className="size-3.5" /> Change
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={refreshing}
            onClick={onRefresh}
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} /> Refresh
          </Button>


          <Button size="sm" variant={following ? "default" : "outline"} className="gap-1.5" onClick={toggleFollow}>
            <Users className="size-3.5" /> {following ? "Following" : "Follow"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={share}>
            <Share2 className="size-3.5" /> Share
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Rating" value={user.rating || "—"} accent={rankColor} />
        <Stat label="Max rating" value={user.maxRating || "—"} />
        <Stat label="Solved" value={dashboard.stats.solved.toLocaleString()} />
        <Stat label="Contests" value={dashboard.stats.contests} />
        <Stat label="Active days" value={`${dashboard.stats.activeDays}/365`} />
        <Stat
          label="Best rank"
          value={dashboard.stats.bestRank ? `#${dashboard.stats.bestRank}` : "—"}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-2xs text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <RefreshCw className="size-3" />
          Last synced {relativeTime(new Date(fetchedAt))}
        </div>
        <a
          href={`https://codeforces.com/profile/${user.handle}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          View on Codeforces <ExternalLink className="size-3" />
        </a>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/60 p-3">
      <div className="text-2xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-display text-xl font-semibold tabular-nums",
          accent,
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================================================
 * OVERVIEW TAB
 * ============================================================ */

function OverviewTab({ journey }: { journey: CFJourney }) {
  const { dashboard } = journey;
  const solvedByYear = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of journey.solved) {
      const y = new Date(s.solvedAt * 1000).getFullYear();
      map.set(String(y), (map.get(String(y)) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([y, n]) => ({ y, n }));
  }, [journey.solved]);

  const avgRating = useMemo(() => {
    const withRating = journey.solved.filter((s) => s.rating);
    if (!withRating.length) return 0;
    return Math.round(withRating.reduce((a, s) => a + (s.rating ?? 0), 0) / withRating.length);
  }, [journey.solved]);

  const solvedSorted = useMemo(
    () => [...journey.solved].sort((a, b) => b.solvedAt - a.solvedAt),
    [journey.solved],
  );

  // ---- Filters ----
  const [minRating, setMinRating] = useState<string>("");
  const [maxRating, setMaxRating] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [attemptFilter, setAttemptFilter] = useState<"all" | "first" | "multi">("all");
  const [visibleSolved, setVisibleSolved] = useState(50);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const p of solvedSorted) p.tags.forEach((t) => s.add(t));
    return [...s].sort();
  }, [solvedSorted]);

  const filteredSolved = useMemo(() => {
    const lo = minRating ? Number(minRating) : -Infinity;
    const hi = maxRating ? Number(maxRating) : Infinity;
    return solvedSorted.filter((p) => {
      if (p.rating != null) {
        if (p.rating < lo || p.rating > hi) return false;
      } else if (minRating || maxRating) {
        return false;
      }
      if (tagFilter !== "all" && !p.tags.includes(tagFilter)) return false;
      if (attemptFilter === "first" && p.attempts !== 1) return false;
      if (attemptFilter === "multi" && p.attempts <= 1) return false;
      return true;
    });
  }, [solvedSorted, minRating, maxRating, tagFilter, attemptFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleSolved(50);
  }, [minRating, maxRating, tagFilter, attemptFilter]);

  const resetFilters = () => {
    setMinRating("");
    setMaxRating("");
    setTagFilter("all");
    setAttemptFilter("all");
  };

  // Custom sheet builder (opened from the filter bar)
  const [customSheetOpen, setCustomSheetOpen] = useState(false);




  return (
    <>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card title="Rating progression" className="lg:col-span-2">
        <CodeforcesRatingChart
          data={dashboard.ratingHistory}
          handle={journey.user.handle}
        />
      </Card>

      <Card title="Highlights">
        <div className="space-y-3">
          {dashboard.storyItems.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Not enough activity yet to build a story.
            </div>
          )}
          {dashboard.storyItems.map((s, i) => {
            const Icon = s.icon === "trophy" ? Trophy : s.icon === "flame" ? Flame : Sparkles;
            return (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{s.headline}</div>
                  <div className="text-xs text-muted-foreground">{s.body}</div>
                </div>
              </div>
            );
          })}
          <div className="border-t border-border/40 pt-3 text-xs text-muted-foreground">
            Avg. problem rating solved: <span className="font-medium text-foreground">{avgRating || "—"}</span>
          </div>
        </div>
      </Card>

      <Card title="Solved per year">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={solvedByYear}>
              <XAxis dataKey="y" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <RTooltip content={<ChartTooltip />} />
              <Bar dataKey="n" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Difficulty distribution">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard.difficultyBuckets}>
              <XAxis dataKey="r" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <RTooltip content={<ChartTooltip />} />
              <Bar dataKey="n" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Favorite tags">
        <div className="flex flex-wrap gap-1.5">
          {dashboard.topics.slice(0, 12).map((t) => (
            <Badge key={t.tag} variant="secondary" className="gap-1">
              {t.tag}
              <span className="text-2xs text-muted-foreground">{t.solved}</span>
            </Badge>
          ))}
        </div>
      </Card>

      <Card title="Activity heatmap (last year)" className="lg:col-span-3">
        <Heatmap cells={dashboard.activityMatrix} />
      </Card>

      <Card title={`Solved problems (showing ${Math.min(visibleSolved, filteredSolved.length)} of ${filteredSolved.length}${filteredSolved.length !== solvedSorted.length ? ` · ${solvedSorted.length} total` : ""})`} className="lg:col-span-3">
        <div className="mb-3 flex flex-wrap items-end gap-2 border-b border-border/40 pb-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Rating
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="min"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="h-8 w-20 text-xs"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="max"
                value={maxRating}
                onChange={(e) => setMaxRating(e.target.value)}
                className="h-8 w-20 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Tag
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
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
              value={attemptFilter}
              onChange={(e) => setAttemptFilter(e.target.value as "all" | "first" | "multi")}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">All solved</option>
              <option value="first">Solved first try</option>
              <option value="multi">Solved after multiple tries</option>
            </select>
          </div>
          {(minRating || maxRating || tagFilter !== "all" || attemptFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
              Clear
            </Button>
          )}
          <div className="ml-auto">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setCustomSheetOpen(true)}
            >
              <Sparkles className="size-3.5" /> Create sheet
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-2xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border/50">
                <th className="py-2 pr-3 text-left font-normal">#</th>
                <th className="py-2 pr-3 text-left font-normal">Name</th>
                <th className="py-2 pr-3 text-left font-normal">Tags</th>
                <th className="py-2 pr-3 text-right font-normal">Rating</th>
                <th className="py-2 pr-3 text-right font-normal">Tries</th>
                <th className="py-2 pr-3 text-right font-normal">Solved</th>
              </tr>
            </thead>
            <tbody>
              {filteredSolved.slice(0, visibleSolved).map((p) => (
                <tr key={p.key} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                    {p.contestId ? `${p.contestId}${p.index}` : p.index}
                  </td>
                  <td className="py-2 pr-3">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                          {t}
                        </Badge>
                      ))}
                      {p.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{p.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={cn(
                      "py-2 pr-3 text-right font-mono text-xs tabular-nums",
                      p.rating ? ratingColor(p.rating) : "text-muted-foreground",
                    )}
                  >
                    {p.rating ?? "—"}
                  </td>
                  <td
                    className={cn(
                      "py-2 pr-3 text-right font-mono text-xs tabular-nums",
                      p.attempts > 1 ? "text-amber-500" : "text-emerald-500",
                    )}
                  >
                    {p.attempts}
                  </td>
                  <td className="py-2 pr-3 text-right text-xs text-muted-foreground">
                    {new Date(p.solvedAt * 1000).toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
              {filteredSolved.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No problems match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {visibleSolved < filteredSolved.length && (
          <div className="mt-3 flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisibleSolved((v) => v + 50)}
              className="text-xs"
            >
              Show more
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Showing {visibleSolved} of {filteredSolved.length}
            </p>
          </div>
        )}
      </Card>

    </div>
    <AnimatePresence>
      {customSheetOpen && (
        <CustomSheetDialog
          solved={solvedSorted}
          allTags={allTags}
          initialMin={minRating}
          initialMax={maxRating}
          initialTag={tagFilter}
          onClose={() => setCustomSheetOpen(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}

/* ============================================================
 * SOLVED TAB
 * ============================================================ */

function SolvedTab({ journey }: { journey: CFJourney }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 3500]);
  const [year, setYear] = useState<string | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "rating">("newest");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    journey.solved.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [journey.solved]);

  const years = useMemo(() => {
    const s = new Set<string>();
    journey.solved.forEach((p) => s.add(String(new Date(p.solvedAt * 1000).getFullYear())));
    return [...s].sort((a, b) => Number(b) - Number(a));
  }, [journey.solved]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = journey.solved.filter((p) => {
      if (ql && !p.name.toLowerCase().includes(ql) && !p.index.toLowerCase().includes(ql)) {
        return false;
      }
      if (tag && !p.tags.includes(tag)) return false;
      if (p.rating != null) {
        if (p.rating < ratingRange[0] || p.rating > ratingRange[1]) return false;
      }
      if (year !== "all") {
        if (String(new Date(p.solvedAt * 1000).getFullYear()) !== year) return false;
      }
      return true;
    });
    if (sort === "oldest") list = [...list].sort((a, b) => a.solvedAt - b.solvedAt);
    else if (sort === "rating")
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else list = [...list].sort((a, b) => b.solvedAt - a.solvedAt);
    return list;
  }, [journey.solved, q, tag, ratingRange, year, sort]);

  const exportCSV = () => {
    const header = "Problem,Rating,Contest,Tags,Solved At,Language,Attempts,URL";
    const rows = filtered.map((p) =>
      [
        `${p.contestId ?? ""}${p.index} - ${p.name.replace(/"/g, '""')}`,
        p.rating ?? "",
        p.contestId ?? "",
        p.tags.join("|"),
        new Date(p.solvedAt * 1000).toISOString(),
        p.language,
        p.attempts,
        p.url,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([`${header}\n${rows.join("\n")}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${journey.user.handle}-solved.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problem name or ID…"
            className="pl-9"
          />
        </div>
        <select
          value={tag ?? ""}
          onChange={(e) => setTag(e.target.value || null)}
          className="h-9 rounded-md border border-border/60 bg-surface/40 px-2 text-sm"
        >
          <option value="">All topics</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value as typeof year)}
          className="h-9 rounded-md border border-border/60 bg-surface/40 px-2 text-sm"
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-9 rounded-md border border-border/60 bg-surface/40 px-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Rating</option>
        </select>
        <RatingRange value={ratingRange} onChange={setRatingRange} />
        <Button size="sm" variant="outline" className="gap-1.5" onClick={exportCSV}>
          <Download className="size-3.5" /> Export
        </Button>
      </div>

      <div className="text-2xs uppercase tracking-widest text-muted-foreground">
        {filtered.length.toLocaleString()} of {journey.solved.length.toLocaleString()} solved problems
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface/80 text-2xs uppercase tracking-widest text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-2 text-left font-normal">Problem</th>
                <th className="px-3 py-2 text-right font-normal">Rating</th>
                <th className="px-3 py-2 text-left font-normal">Tags</th>
                <th className="px-3 py-2 text-right font-normal">Solved</th>
                <th className="px-3 py-2 text-right font-normal">Lang</th>
                <th className="px-3 py-2 text-right font-normal">Try</th>
                <th className="px-3 py-2 text-right font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((p) => (
                <SolvedRow key={p.key} p={p} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No problems match those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 500 && (
          <div className="border-t border-border/40 bg-surface/40 px-3 py-2 text-2xs text-muted-foreground">
            Showing first 500. Refine filters or export CSV for the full set.
          </div>
        )}
      </div>
    </div>
  );
}

function SolvedRow({ p }: { p: CFSolvedProblem }) {
  return (
    <tr className="border-t border-border/40 hover:bg-surface/40">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xs text-muted-foreground">
            {p.contestId ?? "?"}
            {p.index}
          </span>
          <span className="font-medium">{p.name}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        {p.rating ? (
          <span className={ratingColor(p.rating)}>{p.rating}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
          {p.tags.length > 3 && (
            <span className="text-2xs text-muted-foreground">+{p.tags.length - 3}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
        {new Date(p.solvedAt * 1000).toLocaleDateString()}
      </td>
      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{p.language}</td>
      <td className="px-3 py-2 text-right text-xs tabular-nums">{p.attempts}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Bookmark"
          >
            <Bookmark className="size-3.5" />
          </button>
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Open on Codeforces"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </td>
    </tr>
  );
}

function ratingColor(r: number): string {
  if (r >= 2400) return "text-red-500";
  if (r >= 2100) return "text-orange-500";
  if (r >= 1900) return "text-purple-500";
  if (r >= 1600) return "text-blue-500";
  if (r >= 1400) return "text-cyan-500";
  if (r >= 1200) return "text-emerald-500";
  return "text-muted-foreground";
}

function RatingRange({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border/60 bg-surface/40 px-2 py-1">
      <input
        type="number"
        value={value[0]}
        min={0}
        max={3500}
        step={100}
        onChange={(e) => onChange([Number(e.target.value) || 0, value[1]])}
        className="w-16 bg-transparent text-xs outline-none"
      />
      <span className="text-xs text-muted-foreground">–</span>
      <input
        type="number"
        value={value[1]}
        min={0}
        max={3500}
        step={100}
        onChange={(e) => onChange([value[0], Number(e.target.value) || 3500])}
        className="w-16 bg-transparent text-xs outline-none"
      />
    </div>
  );
}

/* ============================================================
 * AI ANALYSIS TAB
 * ============================================================ */

function AnalysisTab({ journey }: { journey: CFJourney }) {
  const insights = useMemo(() => buildInsights(journey), [journey]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Learning timeline" className="lg:col-span-2">
        <div className="relative border-l-2 border-primary/30 pl-4">
          {insights.timeline.map((t, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="absolute -left-[6px] mt-1.5 size-2.5 rounded-full bg-primary" />
              <div className="text-2xs uppercase tracking-widest text-muted-foreground">
                {t.period}
              </div>
              <div className="text-sm font-medium">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.detail}</div>
            </div>
          ))}
          {insights.timeline.length === 0 && (
            <div className="text-sm text-muted-foreground">Not enough history yet.</div>
          )}
        </div>
      </Card>

      <Card title="Strong topics">
        <TopicBars items={insights.strong} tone="success" />
      </Card>
      <Card title="Weak topics">
        <TopicBars items={insights.weak} tone="destructive" />
      </Card>

      <Card title="Practice signals" className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Signal label="Consistency score" value={`${insights.consistency}/100`} />
          <Signal label="Estimated hours" value={`${insights.hours.toLocaleString()}h`} />
          <Signal label="Longest streak" value={`${insights.longestStreak} days`} />
          <Signal label="Longest inactivity" value={`${insights.longestGap} days`} />
        </div>
      </Card>

      <Card title="Most repeated concepts">
        <div className="flex flex-wrap gap-1.5">
          {insights.repeated.map((r) => (
            <Badge key={r.tag} variant="secondary" className="gap-1">
              {r.tag}
              <span className="text-2xs text-muted-foreground">{r.n}</span>
            </Badge>
          ))}
        </div>
      </Card>

      <Card title="Biggest rating jumps">
        <ul className="space-y-2 text-sm">
          {insights.bestJumps.map((j) => (
            <li key={j.contest} className="flex items-center justify-between gap-2">
              <span className="truncate">{j.contest}</span>
              <span className="tabular-nums text-emerald-500">+{j.delta}</span>
            </li>
          ))}
          {insights.bestJumps.length === 0 && (
            <li className="text-muted-foreground">No rated contests yet.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function TopicBars({
  items,
  tone,
}: {
  items: { tag: string; mastery: number; solved: number }[];
  tone: "success" | "destructive";
}) {
  const barColor =
    tone === "success" ? "bg-emerald-500" : "bg-red-500";
  return (
    <div className="space-y-2">
      {items.map((t) => (
        <div key={t.tag}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">{t.tag}</span>
            <span className="text-muted-foreground">{t.solved} solved</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", barColor)}
              style={{ width: `${t.mastery}%` }}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-sm text-muted-foreground">Not enough data.</div>
      )}
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/60 p-3">
      <div className="text-2xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold">{value}</div>
    </div>
  );
}

/* ============================================================
 * COMPARE TAB
 * ============================================================ */

function CompareTab({ journey }: { journey: CFJourney }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
      <Swords className="mx-auto mb-3 size-6 text-muted-foreground" />
      <div className="font-display text-lg font-semibold">Compare with your account</div>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Connect your Codeforces handle in Profile settings to compare topic mastery,
        shared solves, and missing problems against <span className="font-medium">{journey.user.handle}</span>.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <a href="/settings/profile">Connect handle</a>
        </Button>
        <Button size="sm" asChild>
          <a href="/compare">Open compare</a>
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
 * STATS TAB
 * ============================================================ */

function StatsTab({ journey }: { journey: CFJourney }) {
  const { dashboard } = journey;
  const byTag = useMemo(
    () => dashboard.topics.map((t) => ({ name: t.tag, n: t.solved })),
    [dashboard.topics],
  );
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Submission trend (12 mo)">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard.submissionTrend}>
              <XAxis dataKey="m" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <RTooltip content={<ChartTooltip />} />
              <Bar dataKey="accepted" stackId="a" fill="var(--primary)" />
              <Bar dataKey="failed" stackId="a" fill="var(--destructive)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Solved by topic">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byTag} layout="vertical" margin={{ left: 60 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
              <RTooltip content={<ChartTooltip />} />
              <Bar dataKey="n" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Velocity (last 24 weeks)">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard.velocity}>
              <XAxis dataKey="w" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <RTooltip content={<ChartTooltip />} />
              <Bar dataKey="gain" fill="var(--chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Languages">
        <div className="space-y-2">
          {dashboard.languages.map((l) => (
            <div key={l.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{l.name}</span>
                <span className="text-muted-foreground">{l.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${l.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
 * SHARED PIECES
 * ============================================================ */

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-surface/40 p-4",
        className,
      )}
    >
      <div className="mb-3 text-2xs font-medium uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

// Codeforces-official rating bands (background stripes on the rating chart)
const CF_BANDS: { from: number; to: number; color: string; label: string }[] = [
  { from: 0,    to: 1200, color: "#CCCCCC", label: "Newbie" },
  { from: 1200, to: 1400, color: "#77FF77", label: "Pupil" },
  { from: 1400, to: 1600, color: "#77DDBB", label: "Specialist" },
  { from: 1600, to: 1900, color: "#AAAAFF", label: "Expert" },
  { from: 1900, to: 2100, color: "#FF88FF", label: "Candidate Master" },
  { from: 2100, to: 2300, color: "#FFCC88", label: "Master" },
  { from: 2300, to: 2400, color: "#FFBB55", label: "International Master" },
  { from: 2400, to: 2600, color: "#FF7777", label: "Grandmaster" },
  { from: 2600, to: 3000, color: "#FF3333", label: "International GM" },
  { from: 3000, to: 4000, color: "#AA0000", label: "Legendary Grandmaster" },
];

function CodeforcesRatingChart({
  data,
  handle,
}: {
  data: { contest: string; date: string; rating: number }[];
  handle: string;
}) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No rated contests yet.
      </div>
    );
  }
  const peak = data.reduce((m, d) => Math.max(m, d.rating), 0);
  const min = data.reduce((m, d) => Math.min(m, d.rating), Infinity);
  const yMin = Math.max(0, Math.floor((min - 200) / 100) * 100);
  const yMax = Math.max(3200, Math.ceil((peak + 200) / 100) * 100);
  const ticks = CF_BANDS
    .flatMap((b) => [b.from, b.to])
    .filter((v, i, a) => a.indexOf(v) === i && v >= yMin && v <= yMax)
    .sort((a, b) => a - b);

  return (
    <div className="h-72 overflow-hidden rounded-lg border border-border/50">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          {CF_BANDS.map((b) => (
            <ReferenceArea
              key={b.from}
              y1={b.from}
              y2={b.to}
              fill={b.color}
              fillOpacity={0.85}
              stroke="none"
              ifOverflow="hidden"
            />
          ))}
          <CartesianGrid stroke="#00000018" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#333" }}
            tickFormatter={(d) => String(d).slice(0, 4)}
            minTickGap={40}
            stroke="#0006"
          />
          <YAxis
            type="number"
            domain={[yMin, yMax]}
            ticks={ticks}
            tick={{ fontSize: 10, fill: "#111" }}
            width={38}
            stroke="#0006"
          />
          <RTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { contest: string; date: string; rating: number };
              return (
                <div className="rounded-md border border-border/60 bg-background/95 px-2 py-1.5 text-xs shadow-md">
                  <div className="font-medium">{p.contest}</div>
                  <div className="text-muted-foreground">{p.date}</div>
                  <div className="mt-1 tabular-nums">
                    Rating: <span className="font-semibold">{p.rating}</span>
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="linear"
            dataKey="rating"
            stroke="#E8C547"
            strokeWidth={2}
            isAnimationActive={false}
            dot={{ r: 3, fill: "#FFE066", stroke: "#fff", strokeWidth: 1 }}
            activeDot={{ r: 5, fill: "#FF3333", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between px-3 py-1 text-[10px] text-muted-foreground">
        <span>{data.length} rated contests</span>
        <span className="font-medium">{handle}</span>
      </div>
    </div>
  );
}



function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background/95 px-2 py-1 text-xs shadow-md">
      {label != null && (
        <div className="mb-1 font-medium">{String(label)}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ cells }: { cells: number[] }) {
  // Cells are 53 weeks * 7 days, Mon-first, chronological, ending at Sunday of current week.
  // Rebuild the same grid dates so we can render month + weekday labels like GitHub.
  const WEEKS = Math.floor(cells.length / 7);
  const tone = [
    "bg-muted/30",
    "bg-emerald-500/25",
    "bg-emerald-500/50",
    "bg-emerald-500/75",
    "bg-emerald-500",
  ];
  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAY_LABELS = ["Mon","","Wed","","Fri","",""];

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const endDow = (end.getDay() + 6) % 7; // 0=Mon
  const gridEnd = new Date(end);
  gridEnd.setDate(gridEnd.getDate() + (6 - endDow));
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridStart.getDate() - WEEKS * 7 + 1);

  const weeks: { date: Date; level: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: { date: Date; level: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const idx = w * 7 + d;
      const day = new Date(gridStart);
      day.setDate(day.getDate() + idx);
      col.push({ date: day, level: cells[idx] ?? 0 });
    }
    weeks.push(col);
  }

  // Month header: label a week when its first day's month differs from the previous week.
  const monthHeader = weeks.map((col, i) => {
    const m = col[0].date.getMonth();
    const prev = i === 0 ? -1 : weeks[i - 1][0].date.getMonth();
    return m !== prev ? MONTH_LABELS[m] : "";
  });

  const total = cells.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-[3px] pl-8">
          {monthHeader.map((label, i) => (
            <div
              key={i}
              className="w-[11px] text-[10px] leading-none text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex w-6 flex-col gap-[3px] pt-[1px] text-[10px] leading-none text-muted-foreground">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-[11px]">{d}</div>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((col, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {col.map((cell, di) => (
                  <div
                    key={di}
                    className={cn("size-[11px] rounded-[2px]", tone[Math.min(cell.level, 4)])}
                    title={`${cell.date.toISOString().slice(0, 10)} · intensity ${cell.level}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pl-8 pt-1 text-[10px] text-muted-foreground">
          <span>{gridStart.toISOString().slice(0, 10)} → {gridEnd.toISOString().slice(0, 10)}</span>
          <div className="flex items-center gap-1">
            <span>Less</span>
            {tone.map((t, i) => (
              <span key={i} className={cn("size-[11px] rounded-[2px]", t)} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="pl-8 text-[10px] text-muted-foreground">
          Signal from Codeforces submissions · total intensity {total}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * CUSTOM SHEET DIALOG (from filter bar)
 * ============================================================ */


function CustomSheetDialog({
  solved,
  allTags,
  initialMin,
  initialMax,
  initialTag,
  onClose,
}: {
  solved: CFSolvedProblem[];
  allTags: string[];
  initialMin: string;
  initialMax: string;
  initialTag: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [minR, setMinR] = useState(initialMin || "800");
  const [maxR, setMaxR] = useState(initialMax || "3500");
  const [tags, setTags] = useState<string[]>(initialTag !== "all" ? [initialTag] : []);
  const [contest, setContest] = useState("");
  const createMut = useCreateSheet();
  const navigate = useNavigate();


  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const matches = useMemo(() => {
    const lo = Number(minR);
    const hi = Number(maxR);
    const validRange = Number.isFinite(lo) && Number.isFinite(hi);
    const contestQ = contest.trim().toLowerCase();
    return solved.filter((p) => {
      if (p.rating == null) return false;
      if (validRange && (p.rating < lo || p.rating > hi)) return false;
      if (tags.length && !tags.some((t) => p.tags.includes(t))) return false;
      if (contestQ) {
        const idMatch = p.contestId != null && String(p.contestId).includes(contestQ);
        const nameMatch = p.name.toLowerCase().includes(contestQ);
        if (!idMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [solved, minR, maxR, tags, contest]);

  const submit = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast.message("Please sign in to create a sheet.");
      onClose();
      navigate({ to: "/auth", search: { redirect: "/problems" } as never });
      return;
    }
    if (!minR.trim() || !maxR.trim() || !Number.isFinite(Number(minR)) || !Number.isFinite(Number(maxR))) {
      toast.error("Min and max rating are required.");
      return;
    }
    if (Number(minR) > Number(maxR)) {
      toast.error("Min rating must be ≤ max rating.");
      return;
    }
    if (!matches.length) {
      toast.error("No problems match those filters.");
      return;
    }
    const autoName = name.trim() || `Sheet ${minR}–${maxR}${contest.trim() ? ` · ${contest.trim()}` : ""}`;
    try {
      const created = await createMut.mutateAsync({
        name: autoName,
        minRating: Number(minR),
        maxRating: Number(maxR),
        tags,
        contest: contest.trim() || null,
        problems: matches.map((m) => ({
          key: m.key,
          contestId: m.contestId,
          index: m.index,
          name: m.name,
          rating: m.rating,
          tags: m.tags,
          url: m.url,
        })),
      });
      toast.success(`Sheet "${created.name}" created · ${matches.length} problems`);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save sheet.";
      if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("no authorization")) {
        toast.error("Please sign in to save sheets.");
      } else {
        toast.error(msg);
      }
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-2xl border border-border/60 bg-background p-5 shadow-2xl md:rounded-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xs uppercase tracking-widest text-muted-foreground">
              Create practice sheet
            </div>
            <h2 className="font-display text-xl font-semibold">Custom sheet</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-2xs uppercase tracking-widest text-muted-foreground">
              Sheet name <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Graphs sprint · 1600–1900"
              maxLength={80}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-2xs uppercase tracking-widest text-muted-foreground">
              Rating range <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={minR}
                onChange={(e) => setMinR(e.target.value)}
                className="w-24"
                placeholder="min"
                required
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="number"
                value={maxR}
                onChange={(e) => setMaxR(e.target.value)}
                className="w-24"
                placeholder="max"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-2xs uppercase tracking-widest text-muted-foreground">
              Contest <span className="text-muted-foreground/60">(optional · id or name)</span>
            </label>
            <Input
              value={contest}
              onChange={(e) => setContest(e.target.value)}
              placeholder="e.g. 1850 or Educational Round 150"
              maxLength={80}
            />
          </div>

          <div>
            <label className="mb-1 block text-2xs uppercase tracking-widest text-muted-foreground">
              Tags {tags.length ? `(${tags.length} selected)` : "(any)"}
            </label>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-border/50 p-2">
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs transition",
                    tags.includes(t)
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-border",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs">
            <span className="font-medium text-foreground">{matches.length}</span>{" "}
            <span className="text-muted-foreground">
              solved problems match — will be saved into the sheet.
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} className="gap-1.5">
            <Sparkles className="size-3.5" /> Create sheet
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}



/* ============================================================
 * PRACTICE SHEET MODAL
 * ============================================================ */

const SHEET_TEMPLATES: { id: string; label: string; hint: string }[] = [
  { id: "complete", label: "Complete journey", hint: "Full curated path inspired by this profile." },
  { id: "beginner", label: "Beginner sheet", hint: "800–1400 rating problems, foundations first." },
  { id: "rating", label: "Rating sheet", hint: "Focused on climbing to your target rating." },
  { id: "topic", label: "Topic sheet", hint: "One or more topics you pick." },
  { id: "contest", label: "Contest prep", hint: "Mixed rating simulating a real round." },
  { id: "last500", label: "Last 500 solves", hint: "Recreate their last 500 solved problems." },
  { id: "fastest", label: "Fastest growth path", hint: "Problems that historically produced rating jumps." },
  { id: "graphs", label: "Only graphs", hint: "" },
  { id: "dp", label: "Only DP", hint: "" },
  { id: "greedy", label: "Only greedy", hint: "" },
];

function PracticeSheetModal({
  journey,
  onClose,
}: {
  journey: CFJourney;
  onClose: () => void;
}) {
  const [template, setTemplate] = useState("complete");
  const [target, setTarget] = useState(1600);
  const [dailyMins, setDailyMins] = useState(60);
  const [maxProblems, setMaxProblems] = useState(60);

  const preview = useMemo(
    () => buildSheetPreview(journey, template, target, maxProblems),
    [journey, template, target, maxProblems],
  );

  const importIt = () => {
    toast.success(`Imported ${preview.problems.length} problems into Today's Mission (demo).`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-t-2xl border border-border/60 bg-background p-5 shadow-2xl md:rounded-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xs uppercase tracking-widest text-muted-foreground">
              Generate practice sheet
            </div>
            <h2 className="font-display text-xl font-semibold">
              Inspired by {journey.user.handle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 text-2xs uppercase tracking-widest text-muted-foreground">
              Template
            </div>
            <div className="grid gap-1.5">
              {SHEET_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition",
                    template === t.id
                      ? "border-primary bg-primary/10"
                      : "border-border/40 hover:border-border",
                  )}
                >
                  <div className="font-medium">{t.label}</div>
                  {t.hint && (
                    <div className="text-2xs text-muted-foreground">{t.hint}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SliderField
              label="Target rating"
              value={target}
              min={800}
              max={3000}
              step={100}
              onChange={setTarget}
            />
            <SliderField
              label="Daily time (minutes)"
              value={dailyMins}
              min={15}
              max={240}
              step={15}
              onChange={setDailyMins}
            />
            <SliderField
              label="Max problems"
              value={maxProblems}
              min={10}
              max={200}
              step={10}
              onChange={setMaxProblems}
            />

            <div className="rounded-xl border border-border/40 bg-surface/40 p-3 text-sm">
              <div className="flex items-center gap-2 text-2xs uppercase tracking-widest text-muted-foreground">
                <Zap className="size-3 text-primary" /> Preview
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <MiniStat label="Problems" value={preview.problems.length} />
                <MiniStat label="Est. days" value={preview.days} />
                <MiniStat label="Avg rating" value={preview.avgRating} />
                <MiniStat label="Topics" value={preview.topics} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" className="gap-1.5" onClick={importIt}>
                <ArrowRight className="size-3.5" /> Import into Today
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-background/60 p-2">
      <div className="text-2xs text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/* ============================================================
 * HELPERS
 * ============================================================ */

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

function buildInsights(journey: CFJourney) {
  const { dashboard, solved } = journey;
  const strong = [...dashboard.topics].sort((a, b) => b.mastery - a.mastery).slice(0, 6);
  const weak = [...dashboard.topics].sort((a, b) => a.mastery - b.mastery).slice(0, 6);
  const repeated = [...dashboard.topics].sort((a, b) => b.solved - a.solved).slice(0, 12).map((t) => ({ tag: t.tag, n: t.solved }));

  const totalMins = solved.length * 25; // heuristic 25 min per solve
  const hours = Math.round(totalMins / 60);

  // Streaks over solved dates
  const dates = [...new Set(solved.map((s) => new Date(s.solvedAt * 1000).toISOString().slice(0, 10)))].sort();
  let longestStreak = 0;
  let longestGap = 0;
  let cur = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    const dt = new Date(d);
    if (prev) {
      const gap = Math.floor((dt.getTime() - prev.getTime()) / 86400000);
      if (gap === 1) cur += 1;
      else {
        longestGap = Math.max(longestGap, gap);
        cur = 1;
      }
    } else cur = 1;
    longestStreak = Math.max(longestStreak, cur);
    prev = dt;
  }
  const activeDays = dashboard.stats.activeDays;
  const consistency = Math.min(100, Math.round((activeDays / 365) * 100));

  const bestJumps = [...dashboard.contestTimeline]
    .filter((c) => c.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)
    .map((c) => ({ contest: c.id, delta: c.delta }));

  // Timeline: yearly milestones
  const byYear = new Map<number, { count: number; peak: number }>();
  for (const s of solved) {
    const y = new Date(s.solvedAt * 1000).getFullYear();
    const cur = byYear.get(y) ?? { count: 0, peak: 0 };
    cur.count += 1;
    cur.peak = Math.max(cur.peak, s.rating ?? 0);
    byYear.set(y, cur);
  }
  const timeline = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([y, v]) => ({
      period: String(y),
      title: `${v.count} problems solved`,
      detail: v.peak > 0 ? `Hardest: ${v.peak}-rated.` : "Building foundations.",
    }));

  return { strong, weak, repeated, hours, longestStreak, longestGap, consistency, bestJumps, timeline };
}

function buildSheetPreview(
  journey: CFJourney,
  template: string,
  target: number,
  maxProblems: number,
) {
  let pool = journey.solved.filter((p) => p.rating);
  if (template === "beginner") pool = pool.filter((p) => (p.rating ?? 0) <= 1400);
  else if (template === "rating") pool = pool.filter((p) => Math.abs((p.rating ?? 0) - target) <= 200);
  else if (template === "graphs") pool = pool.filter((p) => p.tags.some((t) => t.includes("graph") || t === "dfs and similar" || t === "trees" || t === "shortest paths"));
  else if (template === "dp") pool = pool.filter((p) => p.tags.includes("dp"));
  else if (template === "greedy") pool = pool.filter((p) => p.tags.includes("greedy"));
  else if (template === "last500") pool = journey.solved.slice(0, 500);
  else if (template === "contest") pool = pool.filter((p) => (p.rating ?? 0) >= target - 300 && (p.rating ?? 0) <= target + 300);

  const problems = pool.slice(0, maxProblems);
  const avgRating = problems.length
    ? Math.round(problems.reduce((a, p) => a + (p.rating ?? 0), 0) / problems.length)
    : 0;
  const topics = new Set<string>();
  problems.forEach((p) => p.tags.forEach((t) => topics.add(t)));
  const days = Math.max(1, Math.ceil(problems.length / 3));
  return { problems, avgRating, topics: topics.size, days };
}
