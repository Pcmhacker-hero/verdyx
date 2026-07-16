import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Bookmark,
  BookOpen,
  ChevronRight,
  Copy,
  Filter,
  FolderPlus,
  Heart,
  Layers,
  Map,
  MessageSquare,
  Network,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ds/kbd";
import { cn } from "@/lib/utils";



export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community · Verdiqx" },
      {
        name: "description",
        content:
          "A focused learning community. Follow world-class programmers, share cheat sheets, roadmaps, and notes — no noise, just craft.",
      },
      { property: "og:title", content: "Community · Verdiqx" },
      {
        property: "og:description",
        content:
          "Follow top programmers, share cheat sheets and roadmaps, publish notes, and build focused collections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

// ---------------- data ----------------

type ResourceKind = "cheatsheet" | "roadmap" | "note";

// Map a resource kind to the best-matching existing route.
const KIND_ROUTE: Record<ResourceKind, "/cheatsheets" | "/problems" | "/mistakes"> = {
  cheatsheet: "/cheatsheets",
  roadmap: "/problems",
  note: "/mistakes",
};

interface Author {
  id: string;
  name: string;
  handle: string;
  initials: string;
  title: string;
  verified?: boolean;
  rating?: number;
  followers: number;
  following?: boolean;
  known?: string;
  tone: "indigo" | "amber" | "emerald" | "rose" | "sky" | "violet";
}

interface Resource {
  id: string;
  kind: ResourceKind;
  title: string;
  summary: string;
  author: Author;
  minutes: number;
  topics: string[];
  likes: number;
  comments: number;
  bookmarks: number;
  liked?: boolean;
  bookmarked?: boolean;
  pinned?: boolean;
  updated: string;
}

interface Collection {
  id: string;
  name: string;
  count: number;
  hint: string;
}

const AUTHORS: Record<string, Author> = {
  tourist: {
    id: "tourist",
    name: "Gennady Korotkevich",
    handle: "tourist",
    initials: "GK",
    title: "Legendary competitor",
    verified: true,
    rating: 3800,
    followers: 48210,
    following: true,
    known: "Ad-hoc & constructive",
    tone: "amber",
  },
  petr: {
    id: "petr",
    name: "Petr Mitrichev",
    handle: "petr",
    initials: "PM",
    title: "TopCoder Hall of Fame",
    verified: true,
    rating: 3600,
    followers: 32104,
    known: "Number theory",
    tone: "violet",
  },
  errichto: {
    id: "errichto",
    name: "Kamil Debowski",
    handle: "errichto",
    initials: "KD",
    title: "Educator · Streamer",
    verified: true,
    rating: 2650,
    followers: 21800,
    following: true,
    known: "Explaining hard DP clearly",
    tone: "emerald",
  },
  benq: {
    id: "benq",
    name: "Benjamin Qi",
    handle: "benq",
    initials: "BQ",
    title: "USACO Guide author",
    verified: true,
    rating: 3200,
    followers: 18450,
    known: "Curated roadmaps",
    tone: "indigo",
  },
  neal: {
    id: "neal",
    name: "Neal Wu",
    handle: "nealwu",
    initials: "NW",
    title: "Ex-IOI · Google",
    verified: true,
    rating: 3100,
    followers: 15220,
    known: "Elegant templates",
    tone: "sky",
  },
  um_nik: {
    id: "um_nik",
    name: "Alex Danilyuk",
    handle: "um_nik",
    initials: "AD",
    title: "ICPC world finalist",
    verified: true,
    rating: 3500,
    followers: 12930,
    known: "Graphs & flows",
    tone: "rose",
  },
};

const RESOURCES: Resource[] = [
  {
    id: "r1",
    kind: "cheatsheet",
    title: "Binary Search on Answer — the 8 shapes",
    summary:
      "A single-page decision tree for spotting when the answer is monotonic, plus the exact predicate template for each shape.",
    author: AUTHORS.errichto,
    minutes: 6,
    topics: ["binary-search", "monotonicity", "patterns"],
    likes: 1284,
    comments: 87,
    bookmarks: 942,
    liked: true,
    bookmarked: true,
    pinned: true,
    updated: "2d ago",
  },
  {
    id: "r2",
    kind: "roadmap",
    title: "Graphs from zero to Div1E — a 6-week path",
    summary:
      "Adjacency → BFS/DFS → shortest paths → MST → DSU tricks → flow intuition. 42 curated problems, ordered by insight not difficulty.",
    author: AUTHORS.benq,
    minutes: 14,
    topics: ["graphs", "roadmap", "dsu", "shortest-paths"],
    likes: 2140,
    comments: 214,
    bookmarks: 1789,
    bookmarked: true,
    updated: "5d ago",
  },
  {
    id: "r3",
    kind: "note",
    title: "Why my DP transition was wrong (and how I noticed)",
    summary:
      "A short post-mortem on a knapsack variant where I double-counted a state. The tell was the tiny sample — always run n=3 by hand.",
    author: AUTHORS.tourist,
    minutes: 4,
    topics: ["dp", "debugging", "post-mortem"],
    likes: 3820,
    comments: 342,
    bookmarks: 1204,
    liked: true,
    updated: "8h ago",
  },
  {
    id: "r4",
    kind: "cheatsheet",
    title: "Segment tree — the 4 mental models",
    summary:
      "Point update, range update with lazy, persistent, and Li Chao. Each on one screen with a canonical query for the shape.",
    author: AUTHORS.neal,
    minutes: 9,
    topics: ["segment-tree", "lazy", "structures"],
    likes: 1652,
    comments: 118,
    bookmarks: 1310,
    updated: "1w ago",
  },
  {
    id: "r5",
    kind: "roadmap",
    title: "Number theory before you touch Möbius",
    summary:
      "Modular inverses, CRT, totient, sieve tricks. A checklist that assumes you already know GCD and want the next 10 tools.",
    author: AUTHORS.petr,
    minutes: 11,
    topics: ["number-theory", "roadmap", "modular"],
    likes: 980,
    comments: 64,
    bookmarks: 812,
    updated: "3d ago",
  },
  {
    id: "r6",
    kind: "note",
    title: "Reading editorial without spoiling yourself",
    summary:
      "A 5-step protocol I use: skim tags → cover the code → read only the observation → try again → then read the proof. Keeps the muscle.",
    author: AUTHORS.errichto,
    minutes: 3,
    topics: ["habits", "editorial", "practice"],
    likes: 2410,
    comments: 189,
    bookmarks: 1553,
    bookmarked: true,
    updated: "12h ago",
  },
  {
    id: "r7",
    kind: "cheatsheet",
    title: "Max-flow templates that don't lie about complexity",
    summary:
      "Dinic, MCMF, Hopcroft-Karp. When each actually helps in contest, with the tight bounds you'll see cited in editorials.",
    author: AUTHORS.um_nik,
    minutes: 8,
    topics: ["flow", "graphs", "templates"],
    likes: 1120,
    comments: 76,
    bookmarks: 890,
    updated: "4d ago",
  },
];

const COLLECTIONS: Collection[] = [
  { id: "c1", name: "Weekend graph binge", count: 12, hint: "Roadmap + 8 problems" },
  { id: "c2", name: "DP I keep getting wrong", count: 7, hint: "Notes & post-mortems" },
  { id: "c3", name: "Templates I actually paste", count: 9, hint: "Cheat sheets" },
];

const TRENDING_TOPICS = [
  "segment-tree",
  "dp",
  "graphs",
  "binary-search",
  "number-theory",
  "flows",
  "editorial-habits",
];

// ---------------- page ----------------

type Feed = "for-you" | "following" | "cheatsheets" | "roadmaps" | "notes";

const FEEDS: { id: Feed; label: string; icon: typeof Sparkles }[] = [
  { id: "for-you", label: "For you", icon: Sparkles },
  { id: "following", label: "Following", icon: Users },
  { id: "cheatsheets", label: "Cheat sheets", icon: BookOpen },
  { id: "roadmaps", label: "Roadmaps", icon: Map },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

function CommunityPage() {
  const [feed, setFeed] = useState<Feed>("for-you");
  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState<Set<string>>(
    () => new Set(RESOURCES.filter((r) => r.liked).map((r) => r.id)),
  );
  const [bookmarked, setBookmarked] = useState<Set<string>>(
    () => new Set(RESOURCES.filter((r) => r.bookmarked).map((r) => r.id)),
  );
  const [following, setFollowing] = useState<Set<string>>(
    () =>
      new Set(
        Object.values(AUTHORS)
          .filter((a) => a.following)
          .map((a) => a.id),
      ),
  );

  const toggle = (s: Set<string>, id: string) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter((r) => {
      if (feed === "cheatsheets" && r.kind !== "cheatsheet") return false;
      if (feed === "roadmaps" && r.kind !== "roadmap") return false;
      if (feed === "notes" && r.kind !== "note") return false;
      if (feed === "following" && !following.has(r.author.id)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.topics.some((t) => t.includes(q)) ||
        r.author.name.toLowerCase().includes(q) ||
        r.author.handle.toLowerCase().includes(q)
      );
    }).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [feed, query, following]);

  return (
    <AppShell
      breadcrumb={[{ label: "Community" }]}
      actions={
        <Button asChild size="sm" className="hidden h-8 gap-1.5 sm:inline-flex">
          <Link to="/cheatsheets">
            <Plus className="size-3.5" /> Share
          </Link>
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 md:px-8">
        <Hero />

        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
          <LeftRail feed={feed} onFeedChange={setFeed} followingCount={following.size} />

          <div className="min-w-0 space-y-4">
            <FeedToolbar query={query} onQueryChange={setQuery} count={filtered.length} />

            {filtered.length === 0 ? (
              <EmptyState
                feed={feed}
                onReset={() => {
                  setQuery("");
                  setFeed("for-you");
                }}
              />
            ) : (
              <ul className="space-y-3">
                {filtered.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    liked={liked.has(r.id)}
                    bookmarked={bookmarked.has(r.id)}
                    following={following.has(r.author.id)}
                    onLike={() => setLiked((s) => toggle(s, r.id))}
                    onBookmark={() => setBookmarked((s) => toggle(s, r.id))}
                    onFollow={() => setFollowing((s) => toggle(s, r.author.id))}
                  />
                ))}
              </ul>
            )}
          </div>

          <RightRail
            following={following}
            onToggleFollow={(id) => setFollowing((s) => toggle(s, id))}
          />
        </div>
      </div>
    </AppShell>
  );
}

// ---------------- hero ----------------

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-surface-muted/60 via-background to-background p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-2xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Community · signal over noise
          </div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Learn in public with people who write proofs, not takes.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-[15px]">
            Follow programmers you admire. Share cheat sheets, roadmaps, and notes. Build
            collections that make your practice sharper — nothing else.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="h-9 gap-1.5">
            <Link to="/cheatsheets">
              <Plus className="size-3.5" /> Share cheat sheet
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-9 gap-1.5">
            <Link to="/problems">
              <Map className="size-3.5" /> Publish roadmap
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="h-9 gap-1.5">
            <Link to="/mistakes">
              <NotebookPen className="size-3.5" /> Write note
            </Link>
          </Button>
        </div>
      </div>

      <dl className="relative mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-5 md:grid-cols-4">
        <Stat label="Followed" value="24" hint="+3 this week" />
        <Stat label="Bookmarks" value="112" hint="Across 3 collections" />
        <Stat label="Notes shared" value="7" hint="1.2k reads" />
        <Stat label="Reputation" value="Contributor" hint="Next: Mentor" tone />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-lg font-semibold tracking-tight", tone && "text-primary")}>
          {value}
        </span>
      </dd>
      <p className="text-2xs text-muted-foreground">{hint}</p>
    </div>
  );
}

// ---------------- left rail ----------------

function LeftRail({
  feed,
  onFeedChange,
  followingCount,
}: {
  feed: Feed;
  onFeedChange: (f: Feed) => void;
  followingCount: number;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-6">
        <div>
          <p className="mb-2 px-2 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Feeds
          </p>
          <nav className="space-y-0.5">
            {FEEDS.map((f) => {
              const active = feed === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => onFeedChange(f.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform group-hover:scale-110",
                      active ? "text-primary" : "opacity-80",
                    )}
                    strokeWidth={active ? 2.25 : 2}
                  />
                  <span className="flex-1 truncate text-left">{f.label}</span>
                  {f.id === "following" ? (
                    <span className="font-mono text-2xs text-muted-foreground/70">
                      {followingCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Collections
            </p>
            <button
              type="button"
              onClick={() => toast.success("New collection", { description: "Give it a name after your next bookmark." })}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="New collection"
            >
              <FolderPlus className="size-3.5" />
            </button>
          </div>
          <ul className="space-y-0.5">
            {COLLECTIONS.map((c) => (
              <li key={c.id}>
                <Link
                  to="/search"
                  search={{ q: c.name } as never}
                  className="group flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/60"
                >
                  <Layers className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{c.name}</span>
                    <span className="block truncate text-2xs text-muted-foreground">{c.hint}</span>
                  </span>
                  <span className="font-mono text-2xs text-muted-foreground/70">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 px-2 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Trending topics
          </p>
          <div className="flex flex-wrap gap-1.5 px-2">
            {TRENDING_TOPICS.map((t) => (
              <Link
                key={t}
                to="/search"
                search={{ q: t } as never}
                className="rounded-full border border-border/70 bg-background px-2 py-0.5 font-mono text-2xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---------------- feed toolbar ----------------

function FeedToolbar({
  query,
  onQueryChange,
  count,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  count: number;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search cheat sheets, roadmaps, authors…"
          className="h-9 w-full rounded-md border border-border/70 bg-surface-muted/40 pl-8 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-background"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <Kbd>/</Kbd>
        </span>
      </div>
      <div className="flex items-center gap-2 text-2xs text-muted-foreground">
        <span className="font-mono">{count} results</span>
        <span className="text-muted-foreground/50">·</span>
        <button className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 transition-colors hover:bg-surface-muted">
          <Filter className="size-3" /> Sort: Signal
        </button>
      </div>
    </div>
  );
}

// ---------------- resource card ----------------

const KIND_META: Record<ResourceKind, { label: string; icon: typeof BookOpen; tone: string }> = {
  cheatsheet: {
    label: "Cheat sheet",
    icon: BookOpen,
    tone: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-300",
  },
  roadmap: {
    label: "Roadmap",
    icon: Map,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  note: {
    label: "Note",
    icon: NotebookPen,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
};

const AVATAR_TONE: Record<Author["tone"], string> = {
  indigo: "bg-indigo-500/12 text-indigo-500 dark:text-indigo-300",
  amber: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
  emerald: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  rose: "bg-rose-500/12 text-rose-500 dark:text-rose-300",
  sky: "bg-sky-500/12 text-sky-500 dark:text-sky-300",
  violet: "bg-violet-500/12 text-violet-500 dark:text-violet-300",
};

function ResourceCard({
  resource,
  liked,
  bookmarked,
  following,
  onLike,
  onBookmark,
  onFollow,
}: {
  resource: Resource;
  liked: boolean;
  bookmarked: boolean;
  following: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onFollow: () => void;
}) {
  const meta = KIND_META[resource.kind];
  const Icon = meta.icon;
  const likeCount =
    resource.likes + (liked && !resource.liked ? 1 : !liked && resource.liked ? -1 : 0);
  const bookmarkCount =
    resource.bookmarks +
    (bookmarked && !resource.bookmarked ? 1 : !bookmarked && resource.bookmarked ? -1 : 0);

  return (
    <li>
      <article className="group relative overflow-hidden rounded-xl border border-border/70 bg-background p-4 transition-all hover:border-border hover:shadow-sm md:p-5">
        {resource.pinned ? (
          <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-2xs font-medium text-primary">
            Pinned
          </span>
        ) : null}

        <div className="flex items-start gap-3">
          <Link
            to="/u/$handle"
            params={{ handle: resource.author.handle }}
            aria-label={`Open ${resource.author.name}'s profile`}
          >
            <Avatar className="size-9 shrink-0">
              <AvatarFallback
                className={cn("text-2xs font-semibold", AVATAR_TONE[resource.author.tone])}
              >
                {resource.author.initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              <Link
                to="/u/$handle"
                params={{ handle: resource.author.handle }}
                className="font-medium text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
              >
                {resource.author.name}
              </Link>
              {resource.author.verified ? (
                <BadgeCheck className="size-3.5 text-primary" aria-label="Verified" />
              ) : null}
              <Link
                to="/u/$handle"
                params={{ handle: resource.author.handle }}
                className="text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                @{resource.author.handle}
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <span>{resource.updated}</span>
              <span className="text-muted-foreground/40">·</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-2xs",
                  meta.tone,
                )}
              >
                <Icon className="size-3" />
                {meta.label}
              </span>
            </div>

            <h3 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-tight text-foreground md:text-base">
              <Link
                to={KIND_ROUTE[resource.kind]}
                className="outline-none transition-colors hover:text-primary focus-visible:text-primary"
              >
                {resource.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{resource.summary}</p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {resource.topics.map((t) => (
                <Link
                  key={t}
                  to="/search"
                  search={{ q: t } as never}
                  className="rounded-full bg-surface-muted/70 px-2 py-0.5 font-mono text-2xs text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  #{t}
                </Link>
              ))}
              <span className="ml-auto font-mono text-2xs text-muted-foreground/70">
                {resource.minutes} min read
              </span>
            </div>

            <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3">
              <Action
                icon={Heart}
                label={formatCount(likeCount)}
                active={liked}
                activeClass="text-rose-500"
                onClick={onLike}
                aria-label={liked ? "Unlike" : "Like"}
              />
              <Action
                icon={MessageSquare}
                label={formatCount(resource.comments)}
                aria-label="Comments"
                onClick={() =>
                  toast("Comments", {
                    description: "Threaded comments arrive in the next release.",
                  })
                }
              />
              <Action
                icon={Bookmark}
                label={formatCount(bookmarkCount)}
                active={bookmarked}
                activeClass="text-primary"
                fillWhenActive
                onClick={onBookmark}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
              />
              <Action
                icon={Copy}
                label="Copy"
                aria-label="Copy link"
                onClick={() => {
                  const url =
                    typeof window !== "undefined"
                      ? `${window.location.origin}${KIND_ROUTE[resource.kind]}#${resource.id}`
                      : `${KIND_ROUTE[resource.kind]}#${resource.id}`;
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(url).then(
                      () => toast.success("Link copied"),
                      () => toast.error("Could not copy link"),
                    );
                  }
                }}
              />

              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant={following ? "outline" : "ghost"}
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={onFollow}
                >
                  <UserPlus className="size-3" />
                  {following ? "Following" : "Follow"}
                </Button>
                <Button asChild size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs">
                  <Link to={KIND_ROUTE[resource.kind]}>
                    Read <ChevronRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function Action({
  icon: Icon,
  label,
  active,
  activeClass,
  fillWhenActive,
  onClick,
  ...rest
}: {
  icon: typeof Heart;
  label: ReactNode;
  active?: boolean;
  activeClass?: string;
  fillWhenActive?: boolean;
  onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        active && activeClass,
      )}
      {...rest}
    >
      <Icon
        className={cn("size-3.5 transition-transform", active && "scale-110")}
        fill={fillWhenActive && active ? "currentColor" : "none"}
      />
      <span className="font-mono text-2xs">{label}</span>
    </button>
  );
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

// ---------------- right rail ----------------

function RightRail({
  following,
  onToggleFollow,
}: {
  following: Set<string>;
  onToggleFollow: (id: string) => void;
}) {
  const spotlight = Object.values(AUTHORS);
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-20 space-y-6">
        <section className="rounded-xl border border-border/70 bg-background p-4">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">People to follow</h2>
            <TrendingUp className="size-3.5 text-muted-foreground" />
          </header>
          <ul className="space-y-2.5">
            {spotlight.map((a) => {
              const isFollowing = following.has(a.id);
              return (
                <li key={a.id} className="flex items-start gap-2.5">
                  <Link to="/u/$handle" params={{ handle: a.handle }} aria-label={`Open ${a.name}'s profile`}>
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className={cn("text-2xs font-semibold", AVATAR_TONE[a.tone])}>
                        {a.initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-1">
                      <Link
                        to="/u/$handle"
                        params={{ handle: a.handle }}
                        className="truncate text-xs font-medium outline-none transition-colors hover:text-primary focus-visible:text-primary"
                      >
                        {a.name}
                      </Link>
                      {a.verified ? <BadgeCheck className="size-3 text-primary" /> : null}
                    </div>
                    <p className="truncate text-2xs text-muted-foreground">
                      {a.known} · {formatCount(a.followers)} followers
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "secondary"}
                    className="h-7 px-2 text-xs"
                    onClick={() => onToggleFollow(a.id)}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-background to-background p-4">
          <header className="mb-2 flex items-center gap-2">
            <Network className="size-3.5 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Your circle this week</h2>
          </header>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <Link
              to="/u/$handle"
              params={{ handle: "errichto" }}
              className="font-medium text-foreground hover:text-primary"
            >
              errichto
            </Link>{" "}
            published a note on editorial habits, and{" "}
            <Link
              to="/u/$handle"
              params={{ handle: "tourist" }}
              className="font-medium text-foreground hover:text-primary"
            >
              tourist
            </Link>{" "}
            shared a DP post-mortem you'd like.
          </p>
          <Link
            to="/notifications"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            See weekly digest <ChevronRight className="size-3" />
          </Link>
        </section>

        <section className="rounded-xl border border-dashed border-border/70 p-4">
          <h2 className="text-sm font-semibold tracking-tight">Ship something small</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            A single-page cheat sheet or a 200-word note is enough. The best contributors post short
            and often.
          </p>
          <Button asChild size="sm" className="mt-3 h-8 w-full gap-1.5">
            <Link to="/cheatsheets">
              <Plus className="size-3.5" /> Start writing
            </Link>
          </Button>
        </section>
      </div>
    </aside>
  );
}

// ---------------- empty ----------------

function EmptyState({ feed, onReset }: { feed: Feed; onReset: () => void }) {
  const label = FEEDS.find((f) => f.id === feed)?.label ?? "this feed";
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-background/60 px-6 py-14 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-surface-muted text-muted-foreground">
        <Search className="size-4" />
      </div>
      <h3 className="text-sm font-semibold tracking-tight">
        Nothing here yet in {label.toLowerCase()}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        Try a different feed, follow a few programmers, or share the first cheat sheet on the topic
        yourself.
      </p>
      <Button size="sm" variant="outline" className="mt-4 h-8" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}
