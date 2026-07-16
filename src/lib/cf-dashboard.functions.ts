import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Codeforces user info ----------

export type CFUserInfo = {
  handle: string;
  avatar: string;
  titlePhoto: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  country?: string;
  city?: string;
  organization?: string;
  friendOfCount: number;
  contribution: number;
  firstName?: string;
  lastName?: string;
  registrationTimeSeconds: number;
  lastOnlineTimeSeconds: number;
};

export type CFSolvedProblem = {
  key: string;
  contestId: number | null;
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  solvedAt: number;
  language: string;
  attempts: number;
  url: string;
};


// ---------- Codeforces API types (partial) ----------

type CFRatingChange = {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
};

type CFProblem = {
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
};

type CFSubmission = {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  problem: CFProblem;
  author: { participantType?: string };
  programmingLanguage?: string;
  verdict?: string;
};

// ---------- Output types (match chart shapes) ----------

export type Dashboard = {
  handle: string;
  stats: {
    current: number;
    peak: number;
    contests: number;
    solved: number;
    acceptancePct: number;
    activeDays: number;
    bestRank: number | null;
    bestRankContest: string | null;
    velocityPerWeek: number;
  };
  ratingHistory: { contest: string; date: string; rating: number }[];
  contestTimeline: {
    id: string;
    date: string;
    rating: number;
    delta: number;
    rank: number;
    solved: number;
    outOf: number;
    kind: string;
  }[];
  activityMatrix: number[]; // 53*7
  difficultyBuckets: { r: string; n: number }[];
  topics: { tag: string; solved: number; mastery: number }[];
  submissionMix: { name: string; value: number; tone: "success" | "destructive" | "warning" | "muted" }[];
  submissionTrend: { m: string; accepted: number; failed: number }[];
  habitMatrix: number[][]; // 7x24 Mon..Sun
  velocity: { w: string; gain: number }[];
  languages: { name: string; pct: number }[];
  storyItems: { icon: "trophy" | "flame" | "star"; tone: "primary" | "warning" | "success"; headline: string; body: string }[];
};

// ---------- Fetch helpers ----------

async function cfFetch<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: { "user-agent": "atlas-app/1.0" } });
  const json = (await res.json().catch(() => null)) as
    | { status: string; result?: T; comment?: string }
    | null;
  if (!res.ok || !json) {
    // Codeforces returns 400 + { status:"FAILED", comment:"handle: ... not found" }
    // for missing users. Surface that as null so caller can 404, but throw on
    // 5xx / rate-limit so we don't render an empty profile as if the user exists.
    if (res.status >= 500 || res.status === 429) {
      throw new Error(`Codeforces API is temporarily unavailable (${res.status}).`);
    }
    return null;
  }
  if (json.status !== "OK" || json.result === undefined) return null;
  return json.result;
}

// ---------- Aggregation ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function bucketRating(r: number): string {
  const b = Math.max(800, Math.min(3500, Math.floor(r / 200) * 200));
  return String(b);
}

function verdictBucket(v?: string): { name: string; tone: "success" | "destructive" | "warning" | "muted" } {
  if (!v) return { name: "Other", tone: "muted" };
  if (v === "OK") return { name: "Accepted", tone: "success" };
  if (v === "WRONG_ANSWER") return { name: "Wrong answer", tone: "destructive" };
  if (v === "TIME_LIMIT_EXCEEDED") return { name: "TLE", tone: "warning" };
  if (v === "MEMORY_LIMIT_EXCEEDED") return { name: "MLE", tone: "warning" };
  if (v === "RUNTIME_ERROR") return { name: "Runtime error", tone: "muted" };
  if (v === "COMPILATION_ERROR") return { name: "Compile error", tone: "muted" };
  return { name: v.toLowerCase().replace(/_/g, " "), tone: "muted" };
}

function normalizeLanguage(l?: string): string {
  if (!l) return "Other";
  const s = l.toLowerCase();
  if (s.includes("c++")) return "C++";
  if (s.includes("python") || s.includes("pypy")) return "Python";
  if (s.startsWith("java") && !s.includes("script")) return "Java";
  if (s.includes("kotlin")) return "Kotlin";
  if (s.includes("rust")) return "Rust";
  if (s.includes("go")) return "Go";
  if (s === "c" || s.startsWith("gnu c ") || s.includes(" c ")) return "C";
  if (s.includes("c#")) return "C#";
  if (s.includes("javascript") || s.includes("node")) return "JavaScript";
  if (s.includes("typescript")) return "TypeScript";
  return l.split(" ")[0];
}

function ymd(t: number): string {
  return new Date(t * 1000).toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function computeDashboard(
  handle: string,
  ratings: CFRatingChange[],
  subs: CFSubmission[],
): Dashboard {
  const current = ratings.at(-1)?.newRating ?? 0;
  const peak = ratings.reduce((m, r) => Math.max(m, r.newRating), 0);

  // Rating history
  const ratingHistory = ratings.map((r) => ({
    contest: r.contestName,
    date: ymd(r.ratingUpdateTimeSeconds),
    rating: r.newRating,
  }));

  // Contests solved-in-contest counts (participantType CONTESTANT/OUT_OF_COMPETITION)
  const solvedInContest = new Map<number, Set<string>>(); // contestId -> problem keys
  for (const s of subs) {
    if (s.verdict !== "OK" || !s.contestId) continue;
    const p = s.author.participantType;
    if (p !== "CONTESTANT" && p !== "OUT_OF_COMPETITION") continue;
    const key = `${s.problem.contestId ?? s.contestId}-${s.problem.index}`;
    if (!solvedInContest.has(s.contestId)) solvedInContest.set(s.contestId, new Set());
    solvedInContest.get(s.contestId)!.add(key);
  }

  const contestTimeline = [...ratings]
    .reverse()
    .map((r) => ({
      id: r.contestName,
      date: ymd(r.ratingUpdateTimeSeconds),
      rating: r.newRating,
      delta: r.newRating - r.oldRating,
      rank: r.rank,
      solved: solvedInContest.get(r.contestId)?.size ?? 0,
      outOf: 0,
      kind: /div\.?\s*1/i.test(r.contestName)
        ? "Div. 1"
        : /div\.?\s*2/i.test(r.contestName)
          ? "Div. 2"
          : /div\.?\s*3/i.test(r.contestName)
            ? "Div. 3"
            : /div\.?\s*4/i.test(r.contestName)
              ? "Div. 4"
              : /educational/i.test(r.contestName)
                ? "Edu"
                : "Rated",
    }));

  const bestRankEntry = ratings.reduce<CFRatingChange | null>(
    (best, r) => (best === null || r.rank < best.rank ? r : best),
    null,
  );

  // Unique solved problems (across all sources)
  const uniqueSolved = new Set<string>();
  const solvedByRating = new Map<string, number>();
  const solvedByTag = new Map<string, number>();
  const attemptedByTag = new Map<string, number>();
  const wrongByTag = new Map<string, number>();

  // Verdict mix
  const verdictCounts = new Map<string, { value: number; tone: "success" | "destructive" | "warning" | "muted" }>();

  // Language totals
  const langCounts = new Map<string, number>();

  // Time-based
  const nowMs = Date.now();
  const yearAgo = new Date(nowMs - 365 * 86_400_000);
  const activityByDate = new Map<string, number>();
  const habitMatrix: number[][] = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  const monthTrend = new Map<string, { accepted: number; failed: number }>();
  const weekVelocity = new Map<string, { gain: number; ok: number }>(); // week key -> rating delta / ok solved

  // Prepare last-12-month keys in order
  const lastMonths: string[] = [];
  const nowDate = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    lastMonths.push(key);
    monthTrend.set(key, { accepted: 0, failed: 0 });
  }

  for (const s of subs) {
    const d = new Date(s.creationTimeSeconds * 1000);
    const problemKey = `${s.problem.contestId ?? s.contestId ?? "x"}-${s.problem.index}`;

    // verdict mix
    const vb = verdictBucket(s.verdict);
    const cur = verdictCounts.get(vb.name);
    if (cur) cur.value += 1;
    else verdictCounts.set(vb.name, { value: 1, tone: vb.tone });

    // language
    const lang = normalizeLanguage(s.programmingLanguage);
    langCounts.set(lang, (langCounts.get(lang) ?? 0) + 1);

    // tag attempts
    for (const t of s.problem.tags) {
      attemptedByTag.set(t, (attemptedByTag.get(t) ?? 0) + 1);
      if (s.verdict && s.verdict !== "OK") {
        wrongByTag.set(t, (wrongByTag.get(t) ?? 0) + 1);
      }
    }

    // month trend (last 12 months only)
    const mKey = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthTrend.has(mKey)) {
      const mm = monthTrend.get(mKey)!;
      if (s.verdict === "OK") mm.accepted += 1;
      else if (s.verdict) mm.failed += 1;
    }

    // habit: only past year
    if (d >= yearAgo) {
      const dow = (d.getDay() + 6) % 7; // Mon=0..Sun=6
      habitMatrix[dow][d.getHours()] += 1;

      const dateKey = ymd(s.creationTimeSeconds);
      activityByDate.set(dateKey, (activityByDate.get(dateKey) ?? 0) + 1);
    }

    // AC-only accumulators
    if (s.verdict === "OK" && !uniqueSolved.has(problemKey)) {
      uniqueSolved.add(problemKey);
      if (typeof s.problem.rating === "number") {
        const b = bucketRating(s.problem.rating);
        solvedByRating.set(b, (solvedByRating.get(b) ?? 0) + 1);
      }
      for (const t of s.problem.tags) {
        solvedByTag.set(t, (solvedByTag.get(t) ?? 0) + 1);
      }
    }
  }

  // difficultyBuckets sorted numerically
  const difficultyBuckets = [...solvedByRating.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([r, n]) => ({ r, n }));

  // topics: top 10 tags by solved, mastery = solvedRate * 100 clamped
  const topics = [...solvedByTag.entries()]
    .map(([tag, solved]) => {
      const attempts = attemptedByTag.get(tag) ?? solved;
      const wrong = wrongByTag.get(tag) ?? 0;
      const acc = attempts > 0 ? solved / attempts : 0;
      // mastery: blend acceptance (0..1) with breadth (log scale on solved) minus penalty for wrongs
      const breadth = Math.min(1, Math.log10(solved + 1) / 2); // solved 100 -> ~1
      const penalty = attempts > 0 ? Math.min(0.3, wrong / (attempts * 2)) : 0;
      const mastery = Math.round(Math.max(5, Math.min(99, (acc * 0.6 + breadth * 0.6 - penalty) * 100)));
      return { tag, solved, mastery };
    })
    .sort((a, b) => b.solved - a.solved)
    .slice(0, 10);

  // submissionMix ordered by common set first
  const orderedNames = ["Accepted", "Wrong answer", "TLE", "MLE", "Runtime error", "Compile error"];
  const submissionMix = [
    ...orderedNames
      .filter((n) => verdictCounts.has(n))
      .map((n) => ({ name: n, value: verdictCounts.get(n)!.value, tone: verdictCounts.get(n)!.tone })),
    ...[...verdictCounts.entries()]
      .filter(([n]) => !orderedNames.includes(n))
      .map(([n, v]) => ({ name: n, value: v.value, tone: v.tone })),
  ];

  // Submission trend
  const submissionTrend = lastMonths.map((key) => {
    const [y, m] = key.split("-").map(Number);
    const bucket = monthTrend.get(key)!;
    return { m: `${MONTHS[m]} ${String(y).slice(2)}`, accepted: bucket.accepted, failed: bucket.failed };
  });

  // Languages: pct rounded, top 5
  const totalLang = [...langCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const languages = [...langCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, n]) => ({ name, pct: Math.round((n / totalLang) * 100) }));

  // Activity matrix — last 53 weeks Mon-first, chronological
  const activityMatrix: number[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  // find Sunday of current week
  const endDow = (end.getDay() + 6) % 7; // 0=Mon
  const daysToEnd = 6 - endDow; // days until Sunday of current week
  const gridEnd = new Date(end);
  gridEnd.setDate(gridEnd.getDate() + daysToEnd);
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridStart.getDate() - 53 * 7 + 1);
  // We want grid[col][row] where col=week, row=day (Mon..Sun) — chart uses grid-flow-col grid-rows-7
  // So push in order: for each day from gridStart to gridEnd, one entry, flowing column-by-column of 7 rows
  // grid-flow-col rows-7 means index 0..6 = first column top-to-bottom, etc.
  for (let i = 0; i < 53 * 7; i++) {
    const day = new Date(gridStart);
    day.setDate(day.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const raw = activityByDate.get(key) ?? 0;
    // convert to 0..4 intensity
    const level = raw === 0 ? 0 : raw < 3 ? 1 : raw < 6 ? 2 : raw < 12 ? 3 : 4;
    activityMatrix.push(level);
  }

  // Velocity — last 24 weeks: rating gain if ratings dated in that week, else fall back to unique solves that week (0-centered by median)
  const velocity: { w: string; gain: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const weekEnd = new Date(nowDate);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    let gain = 0;
    for (const r of ratings) {
      const rt = new Date(r.ratingUpdateTimeSeconds * 1000);
      if (rt >= weekStart && rt <= weekEnd) gain += r.newRating - r.oldRating;
    }
    velocity.push({ w: `w${24 - i}`, gain });
  }
  void weekVelocity;

  // Active days in past year
  const activeDays = [...activityByDate.values()].filter((n) => n > 0).length;

  // Acceptance
  const totalWithVerdict = subs.filter((s) => s.verdict).length;
  const totalOk = subs.filter((s) => s.verdict === "OK").length;
  const acceptancePct = totalWithVerdict ? (totalOk / totalWithVerdict) * 100 : 0;

  // Learning velocity: avg rating delta per week last 30 days (or median gain)
  const last30 = velocity.slice(-4); // roughly last 4 weeks
  const velocityPerWeek = last30.length
    ? last30.reduce((a, b) => a + b.gain, 0) / last30.length
    : 0;

  // Story items
  const bestRatingGain = ratings.reduce<CFRatingChange | null>(
    (best, r) => (best === null || r.newRating - r.oldRating > best.newRating - best.oldRating ? r : best),
    null,
  );
  const longestStreak = (() => {
    const dates = [...activityByDate.keys()].sort();
    let best = 0;
    let cur = 0;
    let prev: Date | null = null;
    for (const d of dates) {
      const dt = new Date(d);
      if (prev && daysBetween(prev, dt) === 1) cur += 1;
      else cur = 1;
      best = Math.max(best, cur);
      prev = dt;
    }
    return best;
  })();
  const hardestSolved = subs
    .filter((s) => s.verdict === "OK" && s.problem.rating)
    .reduce<CFSubmission | null>(
      (best, s) => (best === null || (s.problem.rating ?? 0) > (best.problem.rating ?? 0) ? s : best),
      null,
    );

  const storyItems: Dashboard["storyItems"] = [];
  if (peak > 0) {
    storyItems.push({
      icon: "trophy",
      tone: "primary",
      headline: `Peak rating ${peak}`,
      body: bestRatingGain
        ? `Best jump: +${bestRatingGain.newRating - bestRatingGain.oldRating} in ${bestRatingGain.contestName}.`
        : `Your all-time high on Codeforces.`,
    });
  }
  if (longestStreak > 0) {
    storyItems.push({
      icon: "flame",
      tone: "warning",
      headline: `${longestStreak}-day active streak`,
      body: `Your longest consecutive submitting streak in the past year.`,
    });
  }
  if (hardestSolved?.problem.rating) {
    storyItems.push({
      icon: "star",
      tone: "success",
      headline: `Cracked a ${hardestSolved.problem.rating}-rated problem`,
      body: `'${hardestSolved.problem.name}' — hardest problem you've solved.`,
    });
  }

  return {
    handle,
    stats: {
      current,
      peak,
      contests: ratings.length,
      solved: uniqueSolved.size,
      acceptancePct: Math.round(acceptancePct * 10) / 10,
      activeDays,
      bestRank: bestRankEntry?.rank ?? null,
      bestRankContest: bestRankEntry?.contestName ?? null,
      velocityPerWeek: Math.round(velocityPerWeek * 10) / 10,
    },
    ratingHistory,
    contestTimeline,
    activityMatrix,
    difficultyBuckets,
    topics,
    submissionMix,
    submissionTrend,
    habitMatrix,
    velocity,
    languages,
    storyItems,
  };
}

// ---------- Server function ----------

export const getMyCodeforcesDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Dashboard | null> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("codeforces_handle")
      .eq("id", context.userId)
      .maybeSingle();
    const handle = profile?.codeforces_handle;
    if (!handle) return null;

    const [ratings, subs] = await Promise.all([
      cfFetch<CFRatingChange[]>(
        `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
      ),
      cfFetch<CFSubmission[]>(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`,
      ),
    ]);

    return computeDashboard(handle, ratings ?? [], subs ?? []);
  });

// ---------- Public: full journey by handle ----------

export type CFJourney = {
  user: CFUserInfo;
  dashboard: Dashboard;
  solved: CFSolvedProblem[];
  fetchedAt: number;
};

type CFUserInfoRaw = {
  handle: string;
  avatar: string;
  titlePhoto: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  country?: string;
  city?: string;
  organization?: string;
  friendOfCount?: number;
  contribution?: number;
  firstName?: string;
  lastName?: string;
  registrationTimeSeconds: number;
  lastOnlineTimeSeconds: number;
};

function buildSolvedList(subs: CFSubmission[]): CFSolvedProblem[] {
  // Aggregate by problem: earliest AC + attempt count
  const map = new Map<string, CFSolvedProblem & { _attempts: number }>();
  const attemptsByKey = new Map<string, number>();
  for (const s of subs) {
    const cid = s.problem.contestId ?? s.contestId ?? null;
    const key = `${cid ?? "x"}-${s.problem.index}`;
    attemptsByKey.set(key, (attemptsByKey.get(key) ?? 0) + 1);
  }
  for (const s of subs) {
    if (s.verdict !== "OK") continue;
    const cid = s.problem.contestId ?? s.contestId ?? null;
    const key = `${cid ?? "x"}-${s.problem.index}`;
    const prev = map.get(key);
    if (prev && prev.solvedAt <= s.creationTimeSeconds) continue;
    map.set(key, {
      key,
      contestId: cid,
      index: s.problem.index,
      name: s.problem.name,
      rating: s.problem.rating ?? null,
      tags: s.problem.tags,
      solvedAt: s.creationTimeSeconds,
      language: normalizeLanguage(s.programmingLanguage),
      attempts: attemptsByKey.get(key) ?? 1,
      url: cid ? `https://codeforces.com/contest/${cid}/problem/${s.problem.index}` : "#",
      _attempts: 0,
    });
  }
  return [...map.values()]
    .map(({ _attempts, ...rest }) => rest)
    .sort((a, b) => b.solvedAt - a.solvedAt);
}

export const getCodeforcesJourney = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const d = raw as { handle?: string };
    const handle = String(d?.handle ?? "").trim();
    if (!handle || !/^[A-Za-z0-9_.\-]{1,32}$/.test(handle)) {
      throw new Error("Invalid Codeforces handle");
    }
    return { handle };
  })
  .handler(async ({ data }): Promise<CFJourney> => {
    const h = encodeURIComponent(data.handle);
    const [info, ratings, subs] = await Promise.all([
      cfFetch<CFUserInfoRaw[]>(`https://codeforces.com/api/user.info?handles=${h}`),
      cfFetch<CFRatingChange[]>(`https://codeforces.com/api/user.rating?handle=${h}`),
      cfFetch<CFSubmission[]>(`https://codeforces.com/api/user.status?handle=${h}&from=1&count=10000`),
    ]);
    if (!info || !info[0]) throw new Error(`Codeforces handle "${data.handle}" not found`);
    const u = info[0];
    const user: CFUserInfo = {
      handle: u.handle,
      avatar: u.avatar,
      titlePhoto: u.titlePhoto,
      rating: u.rating ?? 0,
      maxRating: u.maxRating ?? 0,
      rank: u.rank ?? "unrated",
      maxRank: u.maxRank ?? "unrated",
      country: u.country,
      city: u.city,
      organization: u.organization,
      friendOfCount: u.friendOfCount ?? 0,
      contribution: u.contribution ?? 0,
      firstName: u.firstName,
      lastName: u.lastName,
      registrationTimeSeconds: u.registrationTimeSeconds,
      lastOnlineTimeSeconds: u.lastOnlineTimeSeconds,
    };
    const dashboard = computeDashboard(u.handle, ratings ?? [], subs ?? []);
    const solved = buildSolvedList(subs ?? []);
    return { user, dashboard, solved, fetchedAt: Date.now() };
  });

