import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Flame,
  List,
  Loader2,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contests")({
  head: () => ({
    meta: [
      { title: "Contest Tracker · Verdiqx" },
      {
        name: "description",
        content:
          "Every upcoming programming contest across Codeforces, AtCoder, CodeChef, LeetCode, HackerRank, and HackerEarth — with live countdowns, bookmarks, reminders, and AI prep.",
      },
      { property: "og:title", content: "Contest Tracker · Verdiqx" },
      {
        property: "og:description",
        content:
          "One calendar for every competitive programming contest. Live countdowns, reminders, Google Calendar export, AI prep plan.",
      },
    ],
  }),
  component: ContestsPage,
});

/* ============================================================
 * TYPES + CONSTANTS
 * ============================================================ */

type Platform = "Codeforces" | "CodeChef" | "LeetCode";

interface Contest {
  id: string;
  name: string;
  platform: Platform;
  url: string;
  start: number; // ms epoch
  end: number;
  durationSec: number;
  division: string | null;
  status: "upcoming" | "live" | "past";
}

const PLATFORM_META: Record<
  Platform,
  {
    color: string;
    bg: string;
    border: string;
    hex: string;
    short: string;
    icon: string; // emoji fallback shown on the tile
    logo: string; // official logo URL
    tileBg: string; // solid-ish tile background for calendar chips
  }
> = {
  Codeforces: {
    color: "text-sky-200",
    bg: "bg-sky-500/10",
    border: "border-sky-500/50",
    hex: "#38bdf8",
    short: "CF",
    icon: "CF",
    logo: "https://codeforces.org/s/0/favicon-32x32.png",
    tileBg: "bg-sky-950/70",
  },
  CodeChef: {
    color: "text-amber-100",
    bg: "bg-amber-500/10",
    border: "border-amber-500/50",
    hex: "#f59e0b",
    short: "CC",
    icon: "CC",
    logo: "https://cdn.codechef.com/images/cc-logo-big.png",
    tileBg: "bg-amber-950/70",
  },
  LeetCode: {
    color: "text-orange-100",
    bg: "bg-orange-500/10",
    border: "border-orange-500/50",
    hex: "#f59e0b",
    short: "LC",
    icon: "LC",
    logo: "https://leetcode.com/favicon-32x32.png",
    tileBg: "bg-neutral-900/80",
  },
};

const ALL_PLATFORMS = Object.keys(PLATFORM_META) as Platform[];

const DIVISION_TAGS = [
  "Div. 1",
  "Div. 2",
  "Div. 3",
  "Div. 4",
  "Educational",
  "Beginner",
  "Starters",
  "Weekly",
  "Biweekly",
];

const BOOKMARKS_KEY = "verdiqx.contest-bookmarks";
const REMINDERS_KEY = "verdiqx.contest-reminders";
const PARTICIPATED_KEY = "verdiqx.contest-participated";
const USER_RATING_KEY = "verdiqx.user-rating";

/* ============================================================
 * DATA FETCH
 * ============================================================ */

function detectPlatformFromSite(site: string): Platform | null {
  const s = site.toLowerCase();
  if (s.includes("codeforces")) return "Codeforces";
  if (s.includes("codechef")) return "CodeChef";
  if (s.includes("leetcode")) return "LeetCode";
  return null;
}

function extractDivision(name: string): string | null {
  const patterns = [
    /Div\.?\s*[1-4]/i,
    /Educational/i,
    /Global\s+Round/i,
    /Starters/i,
    /Beginner/i,
    /Weekly\s+Contest/i,
    /Biweekly\s+Contest/i,
    /Beginner Contest/i,
    /Regular Contest/i,
    /Grand Contest/i,
  ];
  for (const p of patterns) {
    const m = name.match(p);
    if (m) return m[0].replace(/\s+/g, " ");
  }
  return null;
}

async function fetchFromCodeforces(): Promise<Contest[]> {
  const res = await fetch("https://codeforces.com/api/contest.list?gym=false");
  if (!res.ok) throw new Error("codeforces");
  const json = (await res.json()) as {
    status: string;
    result: Array<{
      id: number;
      name: string;
      phase: string;
      durationSeconds: number;
      startTimeSeconds: number;
    }>;
  };
  if (json.status !== "OK") throw new Error("codeforces");
  const now = Date.now();
  const out: Contest[] = [];
  for (const r of json.result) {
    if (r.phase === "FINISHED") continue;
    const start = r.startTimeSeconds * 1000;
    const end = start + r.durationSeconds * 1000;
    const status: Contest["status"] =
      end < now ? "past" : start <= now ? "live" : "upcoming";
    if (status === "past") continue;
    out.push({
      id: `Codeforces-${r.id}`,
      name: r.name,
      platform: "Codeforces",
      url: `https://codeforces.com/contests/${r.id}`,
      start,
      end,
      durationSec: r.durationSeconds,
      division: extractDivision(r.name),
      status,
    });
  }
  return out;
}

async function fetchFromCompeteApi(): Promise<Contest[]> {
  const res = await fetch("https://competeapi.vercel.app/contests/upcoming/");
  if (!res.ok) throw new Error("competeapi");
  const rows = (await res.json()) as Array<{
    site: string;
    title: string;
    startTime: number;
    endTime: number;
    duration: number;
    url: string;
  }>;
  const now = Date.now();
  const out: Contest[] = [];
  for (const r of rows) {
    const platform = detectPlatformFromSite(r.site);
    if (!platform) continue;
    const start = Number(r.startTime);
    const end = Number(r.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const status: Contest["status"] =
      end < now ? "past" : start <= now ? "live" : "upcoming";
    if (status === "past") continue;
    out.push({
      id: `${platform}-${start}-${r.title}`,
      name: r.title,
      platform,
      url: r.url,
      start,
      end,
      durationSec: Math.round((end - start) / 1000) || Math.round(r.duration / 1000),
      division: extractDivision(r.title),
      status,
    });
  }
  return out;
}

async function fetchContests(): Promise<Contest[]> {
  // Fetch multiple sources in parallel; a single failure must not break the page.
  const results = await Promise.allSettled([
    fetchFromCodeforces(),
    fetchFromCompeteApi(),
  ]);
  const all: Contest[] = [];
  let anyOk = false;
  for (const r of results) {
    if (r.status === "fulfilled") {
      anyOk = true;
      all.push(...r.value);
    }
  }
  if (!anyOk) throw new Error("Failed to load contests");
  // Dedupe: prefer Codeforces official entry over competeapi's CF mirror.
  const seen = new Map<string, Contest>();
  for (const c of all) {
    const key = `${c.platform}::${Math.round(c.start / 60000)}::${c.name.toLowerCase().replace(/\s+/g, " ").trim()}`;
    const existing = seen.get(key);
    if (!existing) seen.set(key, c);
    else if (c.platform === "Codeforces" && !existing.id.startsWith("Codeforces-")) {
      seen.set(key, c);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.start - b.start);
}

/* ============================================================
 * PAGE
 * ============================================================ */

function ContestsPage() {
  const navigate = useNavigate();
  const requireAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.message("Please sign in to continue.");
      navigate({ to: "/auth", search: { redirect: "/contests" } as never });
      return false;
    }
    return true;
  };
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // filters
  const [query, setQuery] = useState("");
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(ALL_PLATFORMS));
  const [divisions, setDivisions] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<"all" | "today" | "tomorrow" | "week" | "month">(
    "all",
  );
  const [ratedOnly, setRatedOnly] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [showFilters, setShowFilters] = useState(false);

  // user data
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [reminders, setReminders] = useState<Record<string, number>>({}); // contestId → minutes before
  const [participated, setParticipated] = useState<Set<string>>(new Set());
  const [userRating, setUserRating] = useState<number>(1400);

  // month for calendar
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // details modal
  const [openContest, setOpenContest] = useState<Contest | null>(null);

  // load / refresh
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await fetchContests();
      setContests(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // auto-refresh every 15 min
    const id = window.setInterval(load, 15 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  // live tick every second for countdowns
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // load user prefs
  useEffect(() => {
    try {
      const b = localStorage.getItem(BOOKMARKS_KEY);
      if (b) setBookmarks(new Set(JSON.parse(b)));
      const r = localStorage.getItem(REMINDERS_KEY);
      if (r) setReminders(JSON.parse(r));
      const p = localStorage.getItem(PARTICIPATED_KEY);
      if (p) setParticipated(new Set(JSON.parse(p)));
      const ur = localStorage.getItem(USER_RATING_KEY);
      if (ur) setUserRating(Number(ur));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleBookmark = async (c: Contest) => {
    if (!(await requireAuth())) return;
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(c.id)) {
        next.delete(c.id);
        toast.success("Bookmark removed");
      } else {
        next.add(c.id);
        toast.success(`Bookmarked ${c.name}`);
      }
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const setReminder = async (c: Contest, minutesBefore: number) => {
    if (!(await requireAuth())) return;
    const next = { ...reminders, [c.id]: minutesBefore };
    setReminders(next);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    toast.success(`Reminder set ${minutesBefore < 60 ? `${minutesBefore}m` : `${minutesBefore / 60}h`} before`);
  };

  const clearReminder = async (c: Contest) => {
    if (!(await requireAuth())) return;
    const next = { ...reminders };
    delete next[c.id];
    setReminders(next);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
  };

  // fire browser notifications when reminder time hits
  const firedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const [id, min] of Object.entries(reminders)) {
      const c = contests.find((x) => x.id === id);
      if (!c) continue;
      const fireAt = c.start - min * 60 * 1000;
      if (now >= fireAt && now < c.start && !firedRef.current.has(id)) {
        firedRef.current.add(id);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`${c.platform}: ${c.name}`, {
            body: `Starts in ${Math.max(1, Math.round((c.start - now) / 60000))} min`,
          });
        }
        toast.info(`${c.name} starts in ${Math.round((c.start - now) / 60000)}m`);
      }
    }
  }, [now, reminders, contests]);

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const toggleDivision = (d: string) => {
    setDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  // filter pipeline
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rangeEnd = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      if (dateRange === "today") return d.getTime() + 24 * 3600 * 1000;
      if (dateRange === "tomorrow") return d.getTime() + 48 * 3600 * 1000;
      if (dateRange === "week") return d.getTime() + 7 * 24 * 3600 * 1000;
      if (dateRange === "month") return d.getTime() + 30 * 24 * 3600 * 1000;
      return Infinity;
    })();
    return contests.filter((c) => {
      if (!platforms.has(c.platform)) return false;
      if (divisions.size > 0) {
        const d = c.division ?? "";
        if (![...divisions].some((div) => d.toLowerCase().includes(div.toLowerCase()))) return false;
      }
      if (ratedOnly && !/rated|round/i.test(c.name)) return false;
      if (c.start > rangeEnd) return false;
      if (q) {
        const hay = `${c.name} ${c.platform} ${c.division ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contests, query, platforms, divisions, dateRange, ratedOnly]);

  const upcoming = useMemo(
    () => filtered.filter((c) => c.status !== "past").slice(0, 8),
    [filtered],
  );
  const nextContest = filtered.find((c) => c.start > now) ?? null;
  const bookmarkedList = useMemo(
    () => contests.filter((c) => bookmarks.has(c.id)).sort((a, b) => a.start - b.start),
    [contests, bookmarks],
  );

  const stats = useMemo(
    () => ({
      upcoming: contests.filter((c) => c.status !== "past").length,
      bookmarked: bookmarks.size,
      participated: participated.size,
      hoursUntilNext: nextContest ? Math.max(0, (nextContest.start - now) / 3600000) : null,
    }),
    [contests, bookmarks, participated, nextContest, now],
  );

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <AppShell breadcrumb={[{ label: "Practice" }, { label: "Contests" }]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 space-y-6">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-muted/60 px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
                <CalendarDays className="size-3 text-primary" /> Contest Tracker
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Every round, every judge, one calendar.
              </h1>
              <p className="text-sm text-muted-foreground">
                All times shown in <span className="font-mono text-foreground">{tz}</span> · auto-refresh
                every 15 min
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-border/70 bg-surface-muted/40 p-0.5 text-xs">
                <button
                  onClick={() => setView("calendar")}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors",
                    view === "calendar"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CalendarIcon className="size-3.5" /> Calendar
                </button>
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors",
                    view === "list"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <List className="size-3.5" /> List
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowFilters((v) => !v)}
              >
                <Filter className="size-3.5" /> Filters
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatCard icon={CalendarDays} label="Upcoming" value={stats.upcoming.toString()} />
            <StatCard icon={Bookmark} label="Bookmarked" value={stats.bookmarked.toString()} />
            <StatCard icon={Trophy} label="Participated" value={stats.participated.toString()} />
            <StatCard
              icon={Clock}
              label="Next contest in"
              value={
                stats.hoursUntilNext == null
                  ? "—"
                  : stats.hoursUntilNext < 1
                    ? `${Math.round(stats.hoursUntilNext * 60)}m`
                    : `${stats.hoursUntilNext.toFixed(1)}h`
              }
            />
          </div>

          {/* Search + Platform filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contests, platforms, divisions…"
                className="pl-8"
              />
            </div>
            {ALL_PLATFORMS.map((p) => {
              const active = platforms.has(p);
              const meta = PLATFORM_META[p];
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors",
                    active
                      ? `${meta.bg} ${meta.color} border-transparent`
                      : "border-border/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Extended filters */}
          {showFilters ? (
            <div className="rounded-lg border border-border/70 bg-card p-4 space-y-3">
              <div>
                <p className="mb-2 text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Division
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DIVISION_TAGS.map((d) => {
                    const active = divisions.has(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDivision(d)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-2xs transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/70 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="mb-2 text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Date range
                  </p>
                  <div className="flex gap-1.5">
                    {(["all", "today", "tomorrow", "week", "month"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setDateRange(r)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-2xs capitalize transition-colors",
                          dateRange === r
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/70 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={ratedOnly}
                    onChange={(e) => setRatedOnly(e.target.checked)}
                    className="size-3.5 rounded border-border accent-primary"
                  />
                  Rated contests only
                </label>
              </div>
            </div>
          ) : null}
        </header>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            {loading ? (
              <SkeletonBlock />
            ) : error ? (
              <ErrorBlock error={error} onRetry={load} />
            ) : filtered.length === 0 ? (
              <EmptyBlock />
            ) : view === "calendar" ? (
              <CalendarView
                contests={filtered}
                monthCursor={monthCursor}
                setMonthCursor={setMonthCursor}
                onOpen={setOpenContest}
              />
            ) : (
              <ListView
                contests={filtered}
                now={now}
                bookmarks={bookmarks}
                onBookmark={toggleBookmark}
                onOpen={setOpenContest}
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Next contest reminder card */}
            {nextContest ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.14em] text-primary">
                  <Flame className="size-3" /> Next up
                </div>
                <p className="mt-1 truncate text-sm font-semibold">{nextContest.name}</p>
                <p className="text-2xs text-muted-foreground">
                  {nextContest.platform} · {formatLocal(nextContest.start)}
                </p>
                <p className="mt-2 font-mono text-lg font-semibold tabular-nums">
                  {formatCountdown(nextContest.start - now)}
                </p>
              </div>
            ) : null}

            {/* Upcoming */}
            <SidebarList
              title="Upcoming"
              icon={CalendarDays}
              items={upcoming}
              now={now}
              onOpen={setOpenContest}
              emptyText="No upcoming contests match your filters."
            />

            {/* Bookmarked */}
            <SidebarList
              title="Bookmarked"
              icon={BookmarkCheck}
              items={bookmarkedList.slice(0, 6)}
              now={now}
              onOpen={setOpenContest}
              emptyText="Bookmark contests to prep in advance."
            />

            {/* Custom contest link */}
            <div className="rounded-lg border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" /> Build your own
              </div>
              <p className="mt-1 text-2xs text-muted-foreground">
                Generate a virtual contest tuned to your rating and topics.
              </p>
              <Button asChild size="sm" className="mt-3 w-full gap-1.5">
                <Link to="/simulator">
                  <Zap className="size-3.5" /> Custom contest
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Details modal */}
      <ContestModal
        contest={openContest}
        onClose={() => setOpenContest(null)}
        now={now}
        bookmarked={openContest ? bookmarks.has(openContest.id) : false}
        onBookmark={openContest ? () => toggleBookmark(openContest) : () => {}}
        reminder={openContest ? reminders[openContest.id] : undefined}
        onSetReminder={(min) => openContest && setReminder(openContest, min)}
        onClearReminder={() => openContest && clearReminder(openContest)}
        userRating={userRating}
      />
    </AppShell>
  );
}

/* ============================================================
 * COMPONENTS
 * ============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-3">
      <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading contests…
      </div>
      <div className="mt-4 grid gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-surface-muted/40" />
        ))}
      </div>
    </div>
  );
}

function ErrorBlock({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-6">
      <p className="text-sm font-semibold text-rose-500">Couldn't load contests</p>
      <p className="mt-1 text-xs text-muted-foreground">{error}</p>
      <Button size="sm" className="mt-3" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function EmptyBlock() {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-card p-10 text-center">
      <CalendarDays className="mx-auto size-6 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">No contests match your filters</p>
      <p className="text-2xs text-muted-foreground">Try widening the platforms or date range.</p>
    </div>
  );
}

/* -------- Calendar View -------- */

function CalendarView({
  contests,
  monthCursor,
  setMonthCursor,
  onOpen,
}: {
  contests: Contest[];
  monthCursor: Date;
  setMonthCursor: (d: Date) => void;
  onOpen: (c: Contest) => void;
}) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay = useMemo(() => {
    const m = new Map<string, Contest[]>();
    for (const c of contests) {
      const d = new Date(c.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = m.get(key) ?? [];
      arr.push(c);
      m.set(key, arr);
    }
    return m;
  }, [contests]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <div className="rounded-lg border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
            className="grid size-7 place-items-center rounded-md border border-border/70 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="min-w-[9rem] text-center text-sm font-semibold">
            {monthCursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </p>
          <button
            onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
            className="grid size-7 place-items-center rounded-md border border-border/70 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <button
          onClick={() => {
            const d = new Date();
            setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
          }}
          className="text-2xs text-primary hover:underline"
        >
          Today
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-border/60 text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d)
            return (
              <div
                key={i}
                className="min-h-[132px] sm:min-h-[150px] lg:min-h-[168px] border-b border-r border-border/40 bg-surface-muted/10"
              />
            );
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const items = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={cn(
                "min-h-[132px] sm:min-h-[150px] lg:min-h-[168px] border-b border-r border-border/40 p-2 space-y-1.5",
                isToday && "bg-primary/5",
              )}
            >
              <div
                className={cn(
                  "font-mono text-2xs tabular-nums",
                  isToday ? "font-bold text-primary" : "text-muted-foreground",
                )}
              >
                {d.getDate()}
              </div>
              {items.slice(0, 3).map((c) => {
                const meta = PLATFORM_META[c.platform];
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpen(c)}
                    title={`${c.name} · ${formatHM(c.start)} · ${c.platform}`}
                    className={cn(
                      "group/tile flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs font-semibold transition-transform hover:scale-[1.03] hover:shadow-md",
                      meta.border,
                      meta.tileBg,
                      meta.color,
                    )}
                  >
                    <span
                      aria-hidden
                      className="grid size-4 shrink-0 place-items-center overflow-hidden rounded-[3px] bg-white/90"
                    >
                      <img
                        src={meta.logo}
                        alt=""
                        loading="lazy"
                        className="size-4 object-contain"
                        onError={(e) => {
                          const el = e.currentTarget;
                          el.style.display = "none";
                          const sib = el.nextElementSibling as HTMLElement | null;
                          if (sib) sib.style.display = "block";
                        }}
                      />
                      <span
                        className="hidden text-[8px] font-bold leading-none text-neutral-900"
                        aria-hidden
                      >
                        {meta.short}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  </button>
                );
              })}
              {items.length > 3 ? (
                <p className="text-2xs text-muted-foreground">+{items.length - 3} more</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- List View -------- */

function ListView({
  contests,
  now,
  bookmarks,
  onBookmark,
  onOpen,
}: {
  contests: Contest[];
  now: number;
  bookmarks: Set<string>;
  onBookmark: (c: Contest) => void;
  onOpen: (c: Contest) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-2xs uppercase tracking-[0.12em] text-muted-foreground">
            <th className="px-3 py-2 text-left">Platform</th>
            <th className="px-3 py-2 text-left">Contest</th>
            <th className="px-3 py-2 text-left">Division</th>
            <th className="px-3 py-2 text-left">Start</th>
            <th className="px-3 py-2 text-left">Duration</th>
            <th className="px-3 py-2 text-left">Countdown</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {contests.map((c) => {
            const bm = bookmarks.has(c.id);
            const meta = PLATFORM_META[c.platform];
            return (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-border/40 last:border-0 hover:bg-surface-muted/30"
                onClick={() => onOpen(c)}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-2xs",
                      meta.bg,
                      meta.color,
                    )}
                  >
                    {meta.short}
                  </span>
                </td>
                <td className="min-w-0 max-w-[400px] px-3 py-2.5">
                  <p className="truncate font-medium">{c.name}</p>
                </td>
                <td className="px-3 py-2.5 text-2xs text-muted-foreground">
                  {c.division ?? "—"}
                </td>
                <td className="px-3 py-2.5 font-mono text-2xs tabular-nums text-muted-foreground">
                  {formatLocal(c.start)}
                </td>
                <td className="px-3 py-2.5 font-mono text-2xs tabular-nums text-muted-foreground">
                  {formatDuration(c.durationSec)}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                  {formatCountdown(c.start - now)}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmark(c);
                    }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {bm ? (
                      <BookmarkCheck className="size-4 text-primary" />
                    ) : (
                      <Bookmark className="size-4" />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------- Sidebar list -------- */

function SidebarList({
  title,
  icon: Icon,
  items,
  now,
  onOpen,
  emptyText,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Contest[];
  now: number;
  onOpen: (c: Contest) => void;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <Icon className="size-4 text-primary" />
        <p className="text-sm font-semibold">{title}</p>
        <span className="ml-auto font-mono text-2xs text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-2xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onOpen(c)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-surface-muted/30"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 font-mono text-2xs",
                    PLATFORM_META[c.platform].bg,
                    PLATFORM_META[c.platform].color,
                  )}
                >
                  {PLATFORM_META[c.platform].short}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{c.name}</p>
                  <p className="truncate text-2xs text-muted-foreground">
                    {formatLocal(c.start)} · {formatDuration(c.durationSec)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-2xs tabular-nums text-muted-foreground">
                  {formatCountdown(c.start - now)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------- Contest details modal -------- */

function ContestModal({
  contest,
  onClose,
  now,
  bookmarked,
  onBookmark,
  reminder,
  onSetReminder,
  onClearReminder,
  userRating,
}: {
  contest: Contest | null;
  onClose: () => void;
  now: number;
  bookmarked: boolean;
  onBookmark: () => void;
  reminder: number | undefined;
  onSetReminder: (min: number) => void;
  onClearReminder: () => void;
  userRating: number;
}) {
  if (!contest) return null;
  const meta = PLATFORM_META[contest.platform];
  const remaining = contest.start - now;
  const rating = userRating;
  const rec = buildRecommendation(contest, rating);

  const gcalUrl = buildGoogleCalendarUrl(contest);
  const downloadIcs = () => {
    const ics = buildIcs(contest);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${contest.platform}-${contest.id.slice(0, 12)}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Dialog open={!!contest} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-2xs",
                meta.bg,
                meta.color,
              )}
            >
              {contest.platform}
            </span>
            {contest.division ? (
              <Badge variant="secondary" className="text-2xs">
                {contest.division}
              </Badge>
            ) : null}
            {/rated|round/i.test(contest.name) ? (
              <Badge className="bg-emerald-500/10 text-2xs text-emerald-500">Rated</Badge>
            ) : (
              <Badge variant="outline" className="text-2xs">
                Unrated
              </Badge>
            )}
          </div>
          <DialogTitle className="pr-8 text-left text-lg">{contest.name}</DialogTitle>
        </DialogHeader>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Starts" value={formatLocal(contest.start)} />
          <MiniStat label="Ends" value={formatLocal(contest.end)} />
          <MiniStat label="Duration" value={formatDuration(contest.durationSec)} />
          <MiniStat label="Countdown" value={formatCountdown(remaining)} accent />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <a href={contest.url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" /> Open contest
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onBookmark}>
            {bookmarked ? (
              <>
                <BookmarkCheck className="size-3.5 text-primary" /> Bookmarked
              </>
            ) : (
              <>
                <Bookmark className="size-3.5" /> Bookmark
              </>
            )}
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={gcalUrl} target="_blank" rel="noreferrer">
              <CalendarPlus className="size-3.5" /> Google Calendar
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadIcs}>
            <Download className="size-3.5" /> ICS
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/cheatsheets">
              <BookOpen className="size-3.5" /> Practice sheet
            </Link>
          </Button>
        </div>

        {/* Reminders */}
        <div className="rounded-lg border border-border/70 bg-surface-muted/20 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Bell className="size-3.5 text-primary" />
            <p className="text-xs font-semibold">Reminder</p>
            {reminder ? (
              <button
                onClick={onClearReminder}
                className="ml-auto text-2xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { m: 15, label: "15m" },
              { m: 60, label: "1h" },
              { m: 6 * 60, label: "6h" },
              { m: 12 * 60, label: "12h" },
              { m: 24 * 60, label: "1d" },
            ].map((opt) => (
              <button
                key={opt.m}
                onClick={() => onSetReminder(opt.m)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs transition-colors",
                  reminder === opt.m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {reminder === opt.m ? (
                  <BellRing className="size-3" />
                ) : (
                  <Bell className="size-3" />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <p className="text-sm font-semibold">Verdiqx AI · Should I participate?</p>
          </div>
          <p className="mt-2 text-xs text-foreground">{rec.verdict}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <MiniStat label="Your rating" value={rating.toString()} />
            <MiniStat label="Expected solve" value={`${rec.solveCount}/${rec.total}`} />
            <MiniStat
              label="Rating delta"
              value={`${rec.delta > 0 ? "+" : ""}${rec.delta}`}
              accent={rec.delta >= 0}
            />
            <MiniStat label="Confidence" value={`${rec.confidence}%`} />
          </div>
          <div className="mt-3">
            <p className="text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Revise before contest
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {rec.topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border/70 px-2 py-0.5 text-2xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-card p-2">
      <p className="text-2xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-semibold tabular-nums",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
 * HELPERS
 * ============================================================ */

function formatLocal(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHM(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Live";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

function buildGoogleCalendarUrl(c: Contest): string {
  const fmt = (t: number) => {
    const d = new Date(t);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  };
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${c.platform}: ${c.name}`,
    dates: `${fmt(c.start)}/${fmt(c.end)}`,
    details: `${c.name}\n${c.url}\n\nAdded from Verdiqx.`,
    location: c.url,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcs(c: Contest): string {
  const fmt = (t: number) => {
    const d = new Date(t);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  };
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Verdiqx//Contest Tracker//EN",
    "BEGIN:VEVENT",
    `UID:${c.id}@verdiqx`,
    `DTSTAMP:${fmt(Date.now())}`,
    `DTSTART:${fmt(c.start)}`,
    `DTEND:${fmt(c.end)}`,
    `SUMMARY:${c.platform}: ${c.name}`,
    `DESCRIPTION:${c.url}`,
    `URL:${c.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildRecommendation(
  c: Contest,
  rating: number,
): {
  verdict: string;
  solveCount: number;
  total: number;
  delta: number;
  confidence: number;
  topics: string[];
} {
  // Simple heuristic tuned to typical CF-style rounds.
  const totalGuess =
    c.platform === "Codeforces" && /div\.?\s*2/i.test(c.name)
      ? 6
      : c.platform === "Codeforces" && /div\.?\s*3/i.test(c.name)
        ? 7
        : c.platform === "LeetCode"
          ? 4
          : c.platform === "CodeChef"
            ? 8
            : 5;
  // Solve estimate: rating vs typical difficulty
  const base = c.platform === "Codeforces" && /div\.?\s*3/i.test(c.name) ? 1200 : 1400;
  const skill = rating - base;
  const solve = Math.max(1, Math.min(totalGuess, Math.round(2 + skill / 200)));
  const delta = Math.round((solve - totalGuess / 2) * 12);
  const confidence = Math.max(45, Math.min(95, 60 + Math.round(skill / 20)));
  const topics = pickTopics(c);
  const verdict =
    delta > 15
      ? `Strong fit. You're likely to gain around +${delta} rating solving ${solve}/${totalGuess}.`
      : delta > 0
        ? `Solid match — expect +${delta}. Warm up on the topics below.`
        : `Stretch round. Aim to solve ${solve}/${totalGuess} cleanly and treat rating as a bonus.`;
  return { verdict, solveCount: solve, total: totalGuess, delta, confidence, topics };
}

function pickTopics(c: Contest): string[] {
  const pool = [
    "Binary Search",
    "DP",
    "Greedy",
    "Graphs",
    "Number Theory",
    "Constructive",
    "Data Structures",
    "Two Pointers",
    "Bitmask",
    "DFS/BFS",
  ];
  // deterministic pick from contest id
  const hash = [...c.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 0);
  const picks: string[] = [];
  for (let i = 0; i < 4; i++) picks.push(pool[(hash + i * 7) % pool.length]);
  return [...new Set(picks)];
}
