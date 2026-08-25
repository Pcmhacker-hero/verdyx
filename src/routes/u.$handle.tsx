import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Award,
  Binary,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  Flame,
  Github,
  GitBranch,
  Globe,
  Hexagon,
  Linkedin,
  MapPin,
  Medal,
  Network,
  Share2,
  Sparkles,
  Trophy,
  Twitter,
  Users,
} from "lucide-react";

/* ============================================================
 * ROUTE
 * ============================================================ */

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => {
    const p = PROFILE;
    const url = `/u/${params.handle}`;
    const title = `${p.name} · ${p.rating} on Codeforces · Verdiqx`;
    const description = `${p.tagline} — ${p.stats.solves.toLocaleString()} problems solved, ${p.stats.contests} rated contests, ${p.streak}-day streak.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "profile:username", content: params.handle },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PublicProfilePage,
});

/* ============================================================
 * DATA
 * ============================================================ */

const PROFILE = {
  name: "Alex Kim",
  handle: "alex.kim",
  tagline: "Specialist II on the climb — DP, graphs, and the geometry of quiet focus.",
  location: "Seoul, South Korea",
  joined: "September 2025",
  avatarInitials: "AK",
  rating: 1642,
  peak: 1687,
  rank: "Specialist II",
  percentile: "top 6.4%",
  streak: 47,
  longestStreak: 92,
  followers: 1284,
  following: 213,
  stats: {
    solves: 512,
    contests: 34,
    accuracy: 71,
    avgSolveMin: 18,
    problemsThisMonth: 27,
    ratingDelta30d: 38,
  },
  links: {
    website: "alexkim.dev",
    github: "alexkim",
    twitter: "alexkim_cp",
    linkedin: "alexkim",
  },
};

const RATING_TIMELINE = [
  { m: "Sep 25", r: 800 },
  { m: "Oct", r: 964 },
  { m: "Nov", r: 1112 },
  { m: "Dec", r: 1058 },
  { m: "Jan 26", r: 1204 },
  { m: "Feb", r: 1332 },
  { m: "Mar", r: 1298 },
  { m: "Apr", r: 1441 },
  { m: "May", r: 1512 },
  { m: "Jun", r: 1487 },
  { m: "Jul", r: 1590 },
  { m: "Aug", r: 1642 },
];

const TOPICS = [
  { name: "Dynamic Programming", solves: 94, share: 100 },
  { name: "Graphs", solves: 81, share: 86 },
  { name: "Binary Search", solves: 62, share: 66 },
  { name: "Greedy", solves: 58, share: 62 },
  { name: "Data Structures", solves: 47, share: 50 },
  { name: "Math / Number Theory", solves: 39, share: 41 },
  { name: "Strings", solves: 21, share: 22 },
];

const HEATMAP_WEEKS = 26; // ~half year
// deterministic-ish intensity
const HEATMAP = Array.from({ length: HEATMAP_WEEKS * 7 }, (_, i) => {
  const s = Math.sin(i * 1.318) * 0.5 + 0.5;
  const t = Math.cos(i * 0.71) * 0.5 + 0.5;
  const v = Math.round((s * 0.6 + t * 0.4) * 4);
  return Math.max(0, Math.min(4, v));
});

const CONTESTS = [
  { code: "R989 Div2", date: "Jul 12", place: 812, delta: +21, solved: "3/6", rating: 1642 },
  { code: "R987 Div2", date: "Jul 05", place: 1180, delta: -14, solved: "2/6", rating: 1621 },
  { code: "R985 Edu", date: "Jun 28", place: 604, delta: +32, solved: "4/6", rating: 1635 },
  { code: "R982 Div2", date: "Jun 21", place: 1502, delta: -22, solved: "2/5", rating: 1603 },
  { code: "R980 Div3", date: "Jun 14", place: 348, delta: +18, solved: "6/7", rating: 1625 },
  { code: "R978 Div2", date: "Jun 07", place: 921, delta: +11, solved: "3/6", rating: 1607 },
];

type Tier = "bronze" | "silver" | "gold" | "obsidian";
const BADGES: { name: string; tier: Tier; icon: typeof Medal }[] = [
  { name: "Century", tier: "silver", icon: Medal },
  { name: "Binary Search Ace", tier: "silver", icon: Binary },
  { name: "Graph Cartographer", tier: "gold", icon: Network },
  { name: "Unaided", tier: "gold", icon: Trophy },
  { name: "Clockwork", tier: "silver", icon: Hexagon },
  { name: "Flow State", tier: "obsidian", icon: Sparkles },
];
const TIER_STYLE: Record<Tier, string> = {
  bronze: "ring-amber-700/30 bg-amber-700/5 text-amber-700 dark:text-amber-500",
  silver: "ring-slate-400/30 bg-slate-400/5 text-slate-500 dark:text-slate-300",
  gold: "ring-amber-400/40 bg-amber-400/5 text-amber-500",
  obsidian: "ring-foreground/30 bg-foreground/[0.04] text-foreground",
};

const JOURNEY = [
  { when: "Sep 2025", label: "Started tracking", detail: "First accepted at 800 rating." },
  { when: "Nov 2025", label: "Pupil · 1200", detail: "Focused on constructive + math." },
  { when: "Jan 2026", label: "Specialist · 1400", detail: "First live Div2 D solve." },
  { when: "Mar 2026", label: "30-day streak", detail: "No freezes used." },
  { when: "May 2026", label: "Specialist II · 1600", detail: "Graph curriculum cleared." },
  { when: "Now", label: "Pushing toward 1700", detail: "DP-on-trees track in progress." },
];

const CHEATSHEETS = [
  { title: "Binary search on the answer", stars: 412, views: "8.4k" },
  { title: "Segment tree — lazy propagation", stars: 287, views: "5.1k" },
  { title: "Dijkstra variants — the short list", stars: 194, views: "3.7k" },
];

const ROADMAPS_COMPLETED = [
  { name: "Graph theory · fundamentals", from: 1200, to: 1700, problems: 42 },
  { name: "Binary search mastery", from: 1400, to: 1800, problems: 28 },
  { name: "DP · classical patterns", from: 1400, to: 1700, problems: 35 },
];

/* ============================================================
 * PAGE
 * ============================================================ */

function PublicProfilePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PublicNav />
      <ProfileHeader />
      <main className="mx-auto max-w-[1200px] px-5 pb-24 md:px-8">
        <StatsStrip />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-12">
            <RatingTimeline />
            <TopicsAndHeatmap />
            <ContestsPanel />
            <BadgesPanel />
            <JourneyPanel />
            <ContributionsPanel />
          </div>
          <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">
            <AboutPanel />
            <SocialPanel />
          </aside>
        </div>
        <Footer />
      </main>
    </div>
  );
}

/* ============================================================
 * TOP NAV — minimal, editorial
 * ============================================================ */

function PublicNav() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-foreground text-background">
            <Hexagon className="size-3.5" strokeWidth={2.4} />
          </span>
          <span className="text-sm font-semibold tracking-tight">Verdiqx</span>
          <span className="hidden font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground sm:inline">
            · public profile
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="hidden rounded-md border border-border/70 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            Explore Verdiqx
          </Link>
          <Link
            to="/auth"
            className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-transform hover:-translate-y-[1px]"
          >
            Create your profile
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
 * HERO
 * ============================================================ */

function ProfileHeader() {
  const p = PROFILE;
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* subtle backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(1000px 400px at 15% -20%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 60%), radial-gradient(600px 300px at 100% 0%, color-mix(in oklab, var(--primary) 8%, transparent), transparent 60%)",
        }}
      />
      <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-8 md:py-14">
        <Avatar name={p.name} initials={p.avatarInitials} />

        <div className="min-w-0">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            @{p.handle} · {p.percentile} of active climbers
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{p.name}</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {p.tagline}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3" /> {p.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3" /> Joined {p.joined}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flame className="size-3 text-amber-500" /> {p.streak}-day streak
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <FollowButton />
            <ShareButton />
            <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-card/40 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <Users className="size-3.5" /> Message
            </button>
          </div>
        </div>

        {/* Rating pillar */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <RatingCard label="Rating" value={p.rating} sub={p.rank} accent />
          <RatingCard label="Peak" value={p.peak} sub="Feb 2026" />
        </div>
      </div>
    </section>
  );
}

function Avatar({ name, initials }: { name: string; initials: string }) {
  return (
    <div className="relative">
      <div
        aria-label={name}
        className="grid size-24 place-items-center rounded-2xl bg-foreground text-background shadow-sm md:size-28"
        style={{
          background:
            "conic-gradient(from 220deg at 50% 50%, var(--foreground) 0deg, color-mix(in oklab, var(--foreground) 82%, var(--primary)) 180deg, var(--foreground) 360deg)",
        }}
      >
        <span className="font-serif text-3xl italic tracking-tight text-background md:text-4xl">
          {initials}
        </span>
      </div>
      <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-2xs text-muted-foreground shadow-sm">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        active
      </span>
    </div>
  );
}

function RatingCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: number;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "min-w-[130px] rounded-lg border px-4 py-3 leading-tight " +
        (accent
          ? "border-foreground/40 bg-foreground text-background"
          : "border-border/70 bg-card/50")
      }
    >
      <p
        className={
          "font-mono text-2xs uppercase tracking-[0.14em] " +
          (accent ? "text-background/70" : "text-muted-foreground")
        }
      >
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
      <p className={"mt-0.5 text-2xs " + (accent ? "text-background/75" : "text-muted-foreground")}>
        {sub}
      </p>
    </div>
  );
}

function FollowButton() {
  const [following, setFollowing] = useState(false);
  return (
    <button
      onClick={() => setFollowing((v) => !v)}
      className={
        "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors " +
        (following
          ? "border border-border bg-card text-foreground"
          : "bg-foreground text-background hover:opacity-90")
      }
    >
      {following ? <Check className="size-3.5" /> : <Sparkles className="size-3.5" />}
      {following ? "Following" : "Follow"}
    </button>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      const url =
        typeof window !== "undefined"
          ? window.location.href
          : `/u/${PROFILE.handle}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-card/40 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
      {copied ? "Link copied" : "Share profile"}
    </button>
  );
}

/* ============================================================
 * STATS STRIP
 * ============================================================ */

function StatsStrip() {
  const s = PROFILE.stats;
  const items = [
    { label: "Solves", value: s.solves.toLocaleString(), hint: "all time" },
    { label: "Contests", value: s.contests, hint: "rated" },
    { label: "Accuracy", value: `${s.accuracy}%`, hint: "first-try AC" },
    { label: "Avg. time", value: `${s.avgSolveMin} min`, hint: "per solve" },
    { label: "This month", value: `+${s.problemsThisMonth}`, hint: "problems" },
    { label: "Δ 30 days", value: `+${s.ratingDelta30d}`, hint: "rating" },
    { label: "Followers", value: PROFILE.followers.toLocaleString(), hint: "" },
    { label: "Following", value: PROFILE.following, hint: "" },
  ];
  return (
    <section className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/70 bg-border/60 sm:grid-cols-4 lg:grid-cols-8">
      {items.map((i) => (
        <div key={i.label} className="bg-card px-4 py-3 leading-tight">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            {i.label}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{i.value}</p>
          {i.hint ? <p className="mt-0.5 text-2xs text-muted-foreground">{i.hint}</p> : null}
        </div>
      ))}
    </section>
  );
}

/* ============================================================
 * RATING TIMELINE — SVG line chart
 * ============================================================ */

function RatingTimeline() {
  const data = RATING_TIMELINE;
  const W = 720;
  const H = 220;
  const padX = 32;
  const padY = 24;
  const minR = 700;
  const maxR = 1800;
  const x = (i: number) => padX + (i * (W - padX * 2)) / (data.length - 1);
  const y = (r: number) => padY + ((maxR - r) * (H - padY * 2)) / (maxR - minR);

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.r).toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${x(data.length - 1)} ${H - padY} L ${x(0)} ${H - padY} Z`;

  const bands = [
    { from: 1200, to: 1400, label: "Pupil", color: "#22c55e" },
    { from: 1400, to: 1600, label: "Specialist", color: "#06b6d4" },
    { from: 1600, to: 1900, label: "Expert", color: "#3b82f6" },
  ];

  return (
    <Section
      title="Rating timeline"
      subtitle="12 months on Codeforces · rounds only"
      side={<KpiChip label="peak" value={String(PROFILE.peak)} />}
    >
      <div className="rounded-lg border border-border/70 bg-card p-4">
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full">
            {/* rating bands */}
            {bands.map((b) => (
              <rect
                key={b.label}
                x={padX}
                y={y(b.to)}
                width={W - padX * 2}
                height={y(b.from) - y(b.to)}
                fill={b.color}
                fillOpacity="0.05"
              />
            ))}
            {/* horizontal grid */}
            {[900, 1200, 1500, 1800].map((r) => (
              <g key={r}>
                <line
                  x1={padX}
                  x2={W - padX}
                  y1={y(r)}
                  y2={y(r)}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="2 4"
                  className="text-foreground"
                />
                <text
                  x={W - padX + 4}
                  y={y(r) + 3}
                  className="fill-muted-foreground font-mono text-[9px]"
                >
                  {r}
                </text>
              </g>
            ))}
            {/* area */}
            <path d={area} fill="currentColor" className="text-primary/15" />
            {/* line */}
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            />
            {/* points */}
            {data.map((d, i) => (
              <g key={i}>
                <circle
                  cx={x(i)}
                  cy={y(d.r)}
                  r="2.5"
                  className="fill-background stroke-primary"
                  strokeWidth="1.5"
                />
                {i === data.length - 1 && (
                  <g>
                    <circle cx={x(i)} cy={y(d.r)} r="5" className="fill-primary/20" />
                    <text
                      x={x(i) - 6}
                      y={y(d.r) - 10}
                      className="fill-foreground font-mono text-[10px]"
                      textAnchor="end"
                    >
                      {d.r}
                    </text>
                  </g>
                )}
              </g>
            ))}
            {/* x labels */}
            {data.map((d, i) =>
              i % 2 === 0 ? (
                <text
                  key={d.m + i}
                  x={x(i)}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono text-[9px]"
                >
                  {d.m}
                </text>
              ) : null,
            )}
          </svg>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/50 pt-3 text-2xs text-muted-foreground">
          {bands.map((b) => (
            <span key={b.label} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ background: b.color, opacity: 0.6 }} />
              {b.label} · {b.from}+
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

function KpiChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2.5 py-1 font-mono text-2xs text-muted-foreground">
      <span className="uppercase tracking-[0.14em]">{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </span>
  );
}

/* ============================================================
 * TOPICS + HEATMAP
 * ============================================================ */

function TopicsAndHeatmap() {
  return (
    <Section title="Favorite topics & activity" subtitle="what the last 6 months looked like">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="rounded-lg border border-border/70 bg-card p-4">
          <p className="mb-3 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Favorite topics
          </p>
          <div className="space-y-2.5">
            {TOPICS.map((t) => (
              <div key={t.name}>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span>{t.name}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{t.solves}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                    style={{ width: `${t.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Problem heatmap
            </p>
            <p className="font-mono text-2xs text-muted-foreground">last {HEATMAP_WEEKS} weeks</p>
          </div>
          <Heatmap />
        </div>
      </div>
    </Section>
  );
}

function Heatmap() {
  return (
    <div className="space-y-2">
      <div
        className="grid gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${HEATMAP_WEEKS}, minmax(0, 1fr))`,
          gridAutoFlow: "column",
          gridTemplateRows: "repeat(7, minmax(0, 1fr))",
        }}
        aria-label={`Activity last ${HEATMAP_WEEKS} weeks`}
      >
        {HEATMAP.map((v, i) => (
          <span
            key={i}
            title={`${v} solves`}
            className={
              "aspect-square rounded-[3px] " +
              (v === 0
                ? "bg-surface-muted/60"
                : v === 1
                  ? "bg-primary/20"
                  : v === 2
                    ? "bg-primary/45"
                    : v === 3
                      ? "bg-primary/75"
                      : "bg-primary")
            }
          />
        ))}
      </div>
      <div className="flex items-center justify-between font-mono text-2xs text-muted-foreground">
        <span>27 problems this month</span>
        <div className="flex items-center gap-1">
          <span>less</span>
          {[0, 1, 2, 3, 4].map((v) => (
            <span
              key={v}
              className={
                "size-2 rounded-[2px] " +
                (v === 0
                  ? "bg-surface-muted/60"
                  : v === 1
                    ? "bg-primary/20"
                    : v === 2
                      ? "bg-primary/45"
                      : v === 3
                        ? "bg-primary/75"
                        : "bg-primary")
              }
            />
          ))}
          <span>more</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * CONTESTS
 * ============================================================ */

function ContestsPanel() {
  return (
    <Section title="Contest history" subtitle="last 6 rated rounds">
      <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
        <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] gap-4 border-b border-border/60 px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>Round</span>
          <span className="text-right">Place</span>
          <span className="text-right">Solved</span>
          <span className="text-right">Δ Rating</span>
          <span className="text-right">Rating</span>
        </div>
        <ul>
          {CONTESTS.map((c) => (
            <li
              key={c.code}
              className="grid grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] gap-4 border-b border-border/40 px-4 py-3 text-sm last:border-b-0 hover:bg-surface-muted/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.code}</p>
                <p className="text-2xs text-muted-foreground">{c.date}</p>
              </div>
              <span className="text-right font-mono tabular-nums text-muted-foreground">
                #{c.place}
              </span>
              <span className="text-right font-mono tabular-nums text-muted-foreground">
                {c.solved}
              </span>
              <span
                className={
                  "text-right font-mono tabular-nums " +
                  (c.delta >= 0 ? "text-emerald-500" : "text-amber-500")
                }
              >
                {c.delta >= 0 ? "+" : ""}
                {c.delta}
              </span>
              <span className="text-right font-mono font-medium tabular-nums">{c.rating}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* ============================================================
 * BADGES
 * ============================================================ */

function BadgesPanel() {
  return (
    <Section
      title="Achievements & badges"
      subtitle="the depth of the craft, not the noise of it"
      side={<KpiChip label="earned" value={String(BADGES.length)} />}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.name}
              className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-foreground/30"
            >
              <div
                className={
                  "grid size-10 place-items-center rounded-md ring-1 ring-inset " +
                  TIER_STYLE[b.tier]
                }
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-medium">{b.name}</p>
                <p className="mt-0.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
                  {b.tier}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ============================================================
 * JOURNEY
 * ============================================================ */

function JourneyPanel() {
  return (
    <Section title="Learning journey" subtitle="ten months of small, consistent moves">
      <div className="relative rounded-lg border border-border/70 bg-card p-5">
        <div
          aria-hidden
          className="absolute left-[26px] top-6 bottom-6 w-px bg-gradient-to-b from-primary/60 via-border to-border/40"
        />
        <ol className="space-y-4">
          {JOURNEY.map((j, i) => {
            const now = j.when === "Now";
            return (
              <li key={j.label} className="relative flex items-start gap-4">
                <div
                  className={
                    "z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 bg-background " +
                    (now
                      ? "border-primary text-primary"
                      : i === JOURNEY.length - 1
                        ? "border-dashed border-border text-muted-foreground"
                        : "border-primary text-primary")
                  }
                >
                  <Compass className="size-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1 pt-1 leading-tight">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-medium">{j.label}</p>
                    <span
                      className={
                        "font-mono text-2xs uppercase tracking-[0.14em] " +
                        (now ? "text-primary" : "text-muted-foreground")
                      }
                    >
                      {j.when}
                    </span>
                  </div>
                  <p className="mt-0.5 text-2xs text-muted-foreground">{j.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}

/* ============================================================
 * CONTRIBUTIONS — cheat sheets + roadmaps
 * ============================================================ */

function ContributionsPanel() {
  return (
    <Section title="Published work" subtitle="what Alex has shared with the community">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Cheat sheets · {CHEATSHEETS.length}
            </p>
            <BookOpen className="size-3.5 text-muted-foreground" />
          </div>
          <ul className="space-y-2.5">
            {CHEATSHEETS.map((c) => (
              <li
                key={c.title}
                className="group flex items-center justify-between gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-muted/40"
              >
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm">{c.title}</p>
                  <p className="mt-0.5 font-mono text-2xs text-muted-foreground">
                    ★ {c.stars} · {c.views} views
                  </p>
                </div>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border/70 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Roadmaps completed · {ROADMAPS_COMPLETED.length}
            </p>
            <GitBranch className="size-3.5 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            {ROADMAPS_COMPLETED.map((r) => (
              <li key={r.name}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm">{r.name}</p>
                  <span className="font-mono text-2xs text-muted-foreground">
                    {r.problems} problems
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 font-mono text-2xs text-muted-foreground">
                  <span className="tabular-nums">{r.from}</span>
                  <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-muted/60">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-primary/60 to-primary" />
                  </div>
                  <span className="tabular-nums text-foreground">{r.to}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
 * SIDE PANELS
 * ============================================================ */

function AboutPanel() {
  const p = PROFILE;
  const bio = useMemo(
    () =>
      "Software engineer by day, competitive programmer by evening. Currently working through the Expert curriculum — one clean solve at a time. I write cheat sheets when a topic finally clicks, and mentor two juniors on their first rounds.",
    [],
  );
  return (
    <div className="rounded-lg border border-border/70 bg-card p-5">
      <p className="mb-2 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        About
      </p>
      <p className="text-sm leading-relaxed text-foreground/90">{bio}</p>

      <div className="mt-4 grid gap-2 border-t border-border/50 pt-4 text-xs">
        <ProfileLink icon={Globe} label={p.links.website} />
        <ProfileLink icon={Github} label={`github.com/${p.links.github}`} />
        <ProfileLink icon={Twitter} label={`@${p.links.twitter}`} />
        <ProfileLink icon={Linkedin} label={`linkedin.com/in/${p.links.linkedin}`} />
      </div>
    </div>
  );
}

function ProfileLink({ icon: Icon, label }: { icon: typeof Globe; label: string }) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="group inline-flex items-center justify-between gap-2 text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="size-3.5" />
        {label}
      </span>
      <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

function SocialPanel() {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
          Community
        </p>
        <Users className="size-3.5 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border/60 bg-background p-3 leading-tight">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Followers
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {PROFILE.followers.toLocaleString()}
          </p>
        </div>
        <div className="rounded-md border border-border/60 bg-background p-3 leading-tight">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Following
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{PROFILE.following}</p>
        </div>
      </div>

      <div className="mt-4 flex -space-x-2">
        {["JS", "MR", "TL", "KH", "AV"].map((s, i) => (
          <span
            key={s}
            className="grid size-7 place-items-center rounded-full border-2 border-card bg-surface-muted/60 font-mono text-2xs text-foreground"
            style={{ zIndex: 5 - i }}
          >
            {s}
          </span>
        ))}
        <span className="ml-2 self-center font-mono text-2xs text-muted-foreground">
          + {PROFILE.followers - 5} more
        </span>
      </div>

      <div className="mt-4 rounded-md border border-dashed border-border/60 bg-surface-muted/30 p-3">
        <div className="flex items-start gap-2">
          <Award className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="text-2xs leading-relaxed text-muted-foreground">
            Followed by <span className="text-foreground">tourist</span>,{" "}
            <span className="text-foreground">Errichto</span>, and 12 others you might know.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * SHARED PIECES
 * ============================================================ */

function Section({
  title,
  subtitle,
  side,
  children,
}: {
  title: string;
  subtitle?: string;
  side?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="leading-tight">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {side}
      </div>
      {children}
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-2xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded bg-foreground text-background">
            <Hexagon className="size-3" strokeWidth={2.4} />
          </span>
          <span>Verdiqx · a quiet place for competitive programmers</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-foreground">
            Explore
          </Link>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard?.writeText(window.location.href);
              }
            }}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Copy className="size-3" /> Copy profile URL
          </button>
          <Link to="/auth" className="inline-flex items-center gap-1.5 hover:text-foreground">
            Claim your handle <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
