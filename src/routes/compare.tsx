import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Search, Swords, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare · Verdiqy" },
      {
        name: "description",
        content:
          "Compare two Codeforces profiles side by side — rank, rating, contests, and problems solved.",
      },
    ],
  }),
  component: ComparePage,
});

// ---------- types ----------

type CFUser = {
  handle: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution?: number;
  rank?: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  titlePhoto?: string;
  avatar?: string;
  friendOfCount?: number;
  registrationTimeSeconds?: number;
};

type CFRating = {
  contestId: number;
  contestName: string;
  rank: number;
  oldRating: number;
  newRating: number;
};

type CFSubmission = {
  id: number;
  verdict?: string;
  problem: { contestId?: number; index: string; rating?: number; tags?: string[] };
};

type ProfileStats = {
  user: CFUser;
  contests: number;
  bestRank: number | null;
  solved: number;
  tried: number;
  topTags: { tag: string; count: number }[];
  ratingBuckets: { label: string; count: number }[];
};

// ---------- fetchers ----------

async function fetchCF<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json()) as { status: string; result?: T; comment?: string };
  if (json.status !== "OK" || json.result === undefined) {
    throw new Error(json.comment || "Codeforces request failed");
  }
  return json.result;
}

async function fetchProfile(handle: string): Promise<ProfileStats> {
  const clean = handle.trim();
  if (!/^[A-Za-z0-9_.-]{2,40}$/.test(clean)) {
    throw new Error("Enter a valid Codeforces handle (2–40 chars: letters, digits, . _ -).");
  }
  const [users, ratings, subs] = await Promise.all([
    fetchCF<CFUser[]>(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(clean)}`),
    fetchCF<CFRating[]>(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(clean)}`,
    ).catch(() => [] as CFRating[]),
    fetchCF<CFSubmission[]>(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(clean)}&from=1&count=10000`,
    ).catch(() => [] as CFSubmission[]),
  ]);

  const user = users[0];
  if (!user) throw new Error(`No Codeforces user found for "${clean}".`);

  const solvedSet = new Set<string>();
  const triedSet = new Set<string>();
  const tagCount = new Map<string, number>();
  const buckets = new Map<string, number>();
  const bucketOrder = ["<1200", "1200–1399", "1400–1599", "1600–1899", "1900–2199", "2200+"];
  bucketOrder.forEach((b) => buckets.set(b, 0));

  for (const s of subs) {
    const key = `${s.problem.contestId ?? "x"}-${s.problem.index}`;
    triedSet.add(key);
    if (s.verdict === "OK" && !solvedSet.has(key)) {
      solvedSet.add(key);
      (s.problem.tags ?? []).forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1));
      const r = s.problem.rating;
      let b = "<1200";
      if (r != null) {
        if (r >= 2200) b = "2200+";
        else if (r >= 1900) b = "1900–2199";
        else if (r >= 1600) b = "1600–1899";
        else if (r >= 1400) b = "1400–1599";
        else if (r >= 1200) b = "1200–1399";
      }
      buckets.set(b, (buckets.get(b) ?? 0) + 1);
    }
  }

  const topTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  const bestRank = ratings.length ? Math.min(...ratings.map((r) => r.rank)) : null;

  return {
    user,
    contests: ratings.length,
    bestRank,
    solved: solvedSet.size,
    tried: triedSet.size,
    topTags,
    ratingBuckets: bucketOrder.map((label) => ({ label, count: buckets.get(label) ?? 0 })),
  };
}

// ---------- helpers ----------

function rankColor(rank?: string, rating?: number) {
  const r = rating ?? 0;
  if (r >= 3000 || rank?.includes("legendary")) return "text-red-500";
  if (r >= 2400 || rank?.includes("grandmaster")) return "text-red-400";
  if (r >= 2100 || rank?.includes("master")) return "text-orange-400";
  if (r >= 1900 || rank?.includes("candidate")) return "text-fuchsia-400";
  if (r >= 1600 || rank?.includes("expert")) return "text-blue-400";
  if (r >= 1400 || rank?.includes("specialist")) return "text-cyan-400";
  if (r >= 1200 || rank?.includes("pupil")) return "text-emerald-400";
  return "text-muted-foreground";
}

// ---------- page ----------

function ComparePage() {
  return (
    <AppShell breadcrumb={[{ label: "Compare" }]}>
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.16em] text-muted-foreground">
            <Swords className="size-3.5" /> Head to head
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Compare two Codeforces profiles</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Enter two handles to compare rank, rating, contests, and problems solved.
          </p>
        </header>

        <CompareBoard />
      </div>
    </AppShell>
  );
}

function CompareBoard() {
  const [a, setA] = useState<ProfileStats | null>(null);
  const [b, setB] = useState<ProfileStats | null>(null);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <ProfileColumn stats={a} onLoaded={setA} onClear={() => setA(null)} accent="var(--chart-1)" />
      <ProfileColumn stats={b} onLoaded={setB} onClear={() => setB(null)} accent="var(--chart-2)" />

      {a && b ? (
        <div className="md:col-span-2">
          <ComparisonTable a={a} b={b} />
        </div>
      ) : null}
    </div>
  );
}

function ProfileColumn({
  stats,
  onLoaded,
  onClear,
  accent,
}: {
  stats: ProfileStats | null;
  onLoaded: (s: ProfileStats) => void;
  onClear: () => void;
  accent: string;
}) {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || loading) return;
    setLoading(true);
    try {
      const s = await fetchProfile(handle);
      onLoaded(s);
      toast.success(`Loaded ${s.user.handle}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <span className="mb-3 block h-1 w-12 rounded-full" style={{ background: accent }} />

      {!stats ? (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">
            Codeforces handle
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. tourist"
                className="h-9 pl-8 text-sm"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <Button type="submit" size="sm" className="h-9" disabled={loading || !handle.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Load"}
            </Button>
          </div>
          <p className="text-2xs text-muted-foreground">
            Pulls live data from the Codeforces API.
          </p>
        </form>
      ) : (
        <ProfileCard stats={stats} onClear={onClear} />
      )}
    </div>
  );
}

function ProfileCard({ stats, onClear }: { stats: ProfileStats; onClear: () => void }) {
  const { user } = stats;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return (
    <div>
      <div className="flex items-start gap-3">
        <Avatar className="size-14 border border-border">
          <AvatarImage src={user.titlePhoto ?? user.avatar} alt={user.handle} />
          <AvatarFallback>{user.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={`https://codeforces.com/profile/${user.handle}`}
              target="_blank"
              rel="noreferrer"
              className={cn("text-base font-semibold hover:underline", rankColor(user.rank, user.rating))}
            >
              {user.handle}
            </a>
          </div>
          {fullName ? (
            <div className="text-xs text-muted-foreground">{fullName}</div>
          ) : null}
          <div className="mt-0.5 text-2xs capitalize text-muted-foreground">
            {user.rank ?? "unrated"}
            {user.country ? ` · ${user.country}` : ""}
            {user.organization ? ` · ${user.organization}` : ""}
          </div>
        </div>
        <button
          onClick={onClear}
          aria-label="Change handle"
          className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Stat label="Rating" value={user.rating ?? "—"} accent={rankColor(user.rank, user.rating)} />
        <Stat label="Max rating" value={user.maxRating ?? "—"} accent={rankColor(user.maxRank, user.maxRating)} />
        <Stat label="Contests" value={stats.contests} />
        <Stat
          label="Best rank"
          value={stats.bestRank != null ? `#${stats.bestRank}` : "—"}
          icon={stats.bestRank && stats.bestRank <= 100 ? <Trophy className="size-3 text-amber-400" /> : null}
        />
        <Stat label="Solved" value={stats.solved} />
        <Stat label="Tried" value={stats.tried} />
      </div>

      {stats.topTags.length ? (
        <div className="mt-4">
          <div className="mb-1.5 text-2xs uppercase tracking-widest text-muted-foreground">
            Top tags
          </div>
          <div className="flex flex-wrap gap-1">
            {stats.topTags.map((t) => (
              <span
                key={t.tag}
                className="rounded-full bg-muted/60 px-2 py-0.5 text-2xs text-muted-foreground"
              >
                {t.tag} <span className="tabular-nums">·{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface/40 px-2.5 py-2">
      <div className="text-2xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("flex items-center gap-1 text-base font-semibold tabular-nums", accent)}>
        {icon}
        {value}
      </div>
    </div>
  );
}

// ---------- comparison table ----------

function ComparisonTable({ a, b }: { a: ProfileStats; b: ProfileStats }) {
  const rows: { label: string; av: number | null; bv: number | null; format?: (n: number) => string }[] = [
    { label: "Current rating", av: a.user.rating ?? null, bv: b.user.rating ?? null },
    { label: "Max rating", av: a.user.maxRating ?? null, bv: b.user.maxRating ?? null },
    { label: "Contests played", av: a.contests, bv: b.contests },
    {
      label: "Best rank",
      av: a.bestRank,
      bv: b.bestRank,
      format: (n) => `#${n}`,
    },
    { label: "Problems solved", av: a.solved, bv: b.solved },
    { label: "Problems attempted", av: a.tried, bv: b.tried },
    { label: "Contribution", av: a.user.contribution ?? 0, bv: b.user.contribution ?? 0 },
  ];

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Head-to-head
      </h2>
      <div className="divide-y divide-border/60">
        {rows.map((row) => {
          const lowerBetter = row.label === "Best rank";
          let aWins = false;
          let bWins = false;
          if (row.av != null && row.bv != null) {
            if (row.av === row.bv) {
              // tie
            } else if (lowerBetter) {
              aWins = row.av < row.bv;
              bWins = !aWins;
            } else {
              aWins = row.av > row.bv;
              bWins = !aWins;
            }
          } else if (row.av != null) aWins = true;
          else if (row.bv != null) bWins = true;

          const fmt = (v: number | null) =>
            v == null ? "—" : row.format ? row.format(v) : v.toLocaleString();

          return (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2.5 text-sm"
            >
              <div
                className={cn(
                  "text-right tabular-nums",
                  aWins ? "font-semibold text-primary" : "text-foreground",
                )}
              >
                {fmt(row.av)}
              </div>
              <div className="text-2xs uppercase tracking-widest text-muted-foreground">
                {row.label}
              </div>
              <div
                className={cn(
                  "tabular-nums",
                  bWins ? "font-semibold text-primary" : "text-foreground",
                )}
              >
                {fmt(row.bv)}
              </div>
            </div>
          );
        })}
      </div>

      <RadarCompare a={a} b={b} />



      <div className="mt-5">
        <div className="mb-2 text-2xs uppercase tracking-widest text-muted-foreground">
          Solved by rating
        </div>
        <div className="space-y-1.5">
          {a.ratingBuckets.map((bucket, i) => {
            const av = bucket.count;
            const bv = b.ratingBuckets[i].count;
            const max = Math.max(av, bv, 1);
            return (
              <div key={bucket.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex items-center justify-end gap-2">
                  <span className="w-8 text-right text-2xs tabular-nums text-muted-foreground">
                    {av}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="ml-auto h-full rounded-full"
                      style={{ width: `${(av / max) * 100}%`, background: "var(--chart-1)" }}
                    />
                  </div>
                </div>
                <div className="w-20 text-center text-2xs uppercase tracking-widest text-muted-foreground">
                  {bucket.label}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(bv / max) * 100}%`, background: "var(--chart-2)" }}
                    />
                  </div>
                  <span className="w-8 text-2xs tabular-nums text-muted-foreground">{bv}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- radar visual ----------

function RadarCompare({ a, b }: { a: ProfileStats; b: ProfileStats }) {
  const norm = (av: number, bv: number, invert = false) => {
    const max = Math.max(av, bv, 1);
    const ap = (av / max) * 100;
    const bp = (bv / max) * 100;
    return invert ? { av: 101 - ap, bv: 101 - bp } : { av: ap, bv: bp };
  };

  const bestA = a.bestRank ?? 999999;
  const bestB = b.bestRank ?? 999999;

  const metrics = [
    { key: "Rating", ...norm(a.user.rating ?? 0, b.user.rating ?? 0) },
    { key: "Max rating", ...norm(a.user.maxRating ?? 0, b.user.maxRating ?? 0) },
    { key: "Contests", ...norm(a.contests, b.contests) },
    { key: "Solved", ...norm(a.solved, b.solved) },
    { key: "Best rank", ...norm(bestA, bestB, true) },
    {
      key: "Contribution",
      ...norm(Math.max(a.user.contribution ?? 0, 0), Math.max(b.user.contribution ?? 0, 0)),
    },
  ];

  const data = metrics.map((m) => ({
    metric: m.key,
    [a.user.handle]: Math.round(m.av),
    [b.user.handle]: Math.round(m.bv),
  }));

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-2xs uppercase tracking-widest text-muted-foreground">
          Visual comparison
        </div>
        <div className="flex items-center gap-3 text-2xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: "var(--chart-1)" }} />
            {a.user.handle}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: "var(--chart-2)" }} />
            {b.user.handle}
          </span>
        </div>
      </div>
      <div className="h-[320px] w-full rounded-xl border border-border/60 bg-surface/30 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name={a.user.handle}
              dataKey={a.user.handle}
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.35}
            />
            <Radar
              name={b.user.handle}
              dataKey={b.user.handle}
              stroke="var(--chart-2)"
              fill="var(--chart-2)"
              fillOpacity={0.35}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-2xs text-muted-foreground">
        Each axis is normalized to 0–100 against the higher of the two profiles. Best rank is
        inverted so a taller shape means better rank.
      </p>
    </div>
  );
}
