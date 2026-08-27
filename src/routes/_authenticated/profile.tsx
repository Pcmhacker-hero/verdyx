import { createFileRoute, Link } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyCodeforcesDashboard, type Dashboard } from "@/lib/cf-dashboard.functions";
import { toast } from "sonner";
import {
  Award,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Gauge,
  Github,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Rocket,
  Share2,
  Sparkles,
  Star,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Unlink,
  X,
  Zap,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  ArrowRight,
  Code2,
  BarChart3,
  Bug,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Kbd } from "@/components/ds/kbd";
import { cn } from "@/lib/utils";
import { seededRandom } from "@/lib/rand";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyProfile,
  linkCodeforcesHandle,
  unlinkCodeforcesHandle,
  updateMyProfile,
} from "@/lib/profile.functions";
import { syncUserSubmissions } from "@/lib/codeforces.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile · Verdiqy" },
      {
        name: "description",
        content:
          "Your competitive programming profile: link your Codeforces handle, upload an avatar, and track rating evolution, contests, topics and habits.",
      },
    ],
  }),
  component: ProfilePage,
});

/* ============================================================
 * Rating band helpers — Codeforces color scale
 * ============================================================ */

type Band = {
  name: string;
  min: number;
  colorVar: string;
  hex: string;
};

const bands: Band[] = [
  { name: "Newbie", min: 0, colorVar: "--band-gray", hex: "#808080" },
  { name: "Pupil", min: 1200, colorVar: "--band-green", hex: "#008000" },
  { name: "Specialist", min: 1400, colorVar: "--band-cyan", hex: "#03A89E" },
  { name: "Expert", min: 1600, colorVar: "--band-blue", hex: "#0000FF" },
  { name: "Candidate Master", min: 1900, colorVar: "--band-violet", hex: "#AA00AA" },
  { name: "Master", min: 2100, colorVar: "--band-orange", hex: "#FF8C00" },
  { name: "Grandmaster", min: 2400, colorVar: "--band-red", hex: "#FF0000" },
];

function bandFor(rating: number): Band {
  return [...bands].reverse().find((b) => rating >= b.min) ?? bands[0];
}

/* ============================================================
 * Mock domain data (Codeforces-shaped)
 * ============================================================ */

const DashboardContext = createContext<Dashboard | null>(null);
const useDashboard = () => useContext(DashboardContext);

const demoProfile = {
  handle: "your-handle",
  fullName: "",
  country: "",
  organization: "",
  joined: "",
  current: 0,
  peak: 0,
  contests: 74,
  solved: 1284,
  friends: 312,
  rank: "Unrated",
};

const rng = seededRandom(0x51a1c0de);

const ratingHistory = Array.from({ length: 36 }).map((_, i) => {
  const base = 1400 + i * 22 + Math.sin(i / 2) * 90;
  return {
    contest: `Round #${820 + i}`,
    date: new Date(2023, 0, 1 + i * 21).toISOString().slice(0, 10),
    rating: Math.round(base + (rng() - 0.4) * 60),
  };
});
// force peak
ratingHistory[28].rating = 2402;
ratingHistory[ratingHistory.length - 1].rating = 2187;

const contestTimeline = [...ratingHistory]
  .slice(-12)
  .reverse()
  .map((r, i, arr) => {
    const prev = arr[i + 1]?.rating ?? r.rating;
    const delta = r.rating - prev;
    return {
      id: r.contest,
      date: r.date,
      rating: r.rating,
      delta,
      rank: Math.round(50 + rng() * 900),
      solved: 3 + Math.floor(rng() * 3),
      outOf: 6,
      kind: rng() > 0.35 ? "Div. 2" : "Div. 1",
    };
  });

const activityMatrix = Array.from({ length: 53 * 7 }).map(() => {
  const r = rng();
  return r > 0.82 ? 4 : r > 0.65 ? 3 : r > 0.45 ? 2 : r > 0.2 ? 1 : 0;
});

const difficultyBuckets = [
  { r: "800", n: 42 },
  { r: "1000", n: 96 },
  { r: "1200", n: 158 },
  { r: "1400", n: 214 },
  { r: "1600", n: 246 },
  { r: "1800", n: 218 },
  { r: "2000", n: 148 },
  { r: "2200", n: 92 },
  { r: "2400", n: 48 },
  { r: "2600", n: 18 },
  { r: "2800", n: 4 },
];

const topics = [
  { tag: "dp", solved: 182, mastery: 78 },
  { tag: "graphs", solved: 164, mastery: 82 },
  { tag: "greedy", solved: 148, mastery: 88 },
  { tag: "math", solved: 141, mastery: 74 },
  { tag: "data structures", solved: 128, mastery: 71 },
  { tag: "implementation", solved: 121, mastery: 91 },
  { tag: "binary search", solved: 88, mastery: 76 },
  { tag: "strings", solved: 64, mastery: 58 },
  { tag: "geometry", solved: 32, mastery: 41 },
  { tag: "number theory", solved: 71, mastery: 63 },
];

const submissionMix = [
  { name: "Accepted", value: 1284, tone: "success" as const },
  { name: "Wrong answer", value: 486, tone: "destructive" as const },
  { name: "TLE", value: 178, tone: "warning" as const },
  { name: "Runtime error", value: 92, tone: "muted" as const },
  { name: "Compile error", value: 34, tone: "muted" as const },
];

const submissionTrend = Array.from({ length: 12 }).map((_, i) => ({
  m: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  accepted: 40 + Math.round(rng() * 40),
  failed: 20 + Math.round(rng() * 25),
}));

const habitMatrix = Array.from({ length: 7 }).map((_, day) =>
  Array.from({ length: 24 }).map((__, hour) => {
    // Peaks around evenings and weekends
    const w = day >= 5 ? 1.25 : 1;
    const h = hour >= 19 && hour <= 23 ? 1.6 : hour >= 12 && hour <= 15 ? 1.1 : 0.5;
    return Math.round(rng() * 10 * w * h);
  }),
);

const velocity = Array.from({ length: 24 }).map((_, i) => ({
  w: `w${i + 1}`,
  gain: Math.round(Math.sin(i / 3) * 14 + (rng() - 0.3) * 12),
}));

const languages = [
  { name: "C++", pct: 72 },
  { name: "Python", pct: 18 },
  { name: "Rust", pct: 7 },
  { name: "Kotlin", pct: 3 },
];

/* ============================================================
 * Page
 * ============================================================ */

function ProfilePage() {
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const syncedHandleRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const syncSubmissionsFn = useServerFn(syncUserSubmissions);
  const profileQuery = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const p = profileQuery.data;
  const hasHandle = !!p?.codeforces_handle;
  const dashboardQuery = useQuery({
    queryKey: ["cf-dashboard", p?.codeforces_handle ?? null],
    queryFn: () => getMyCodeforcesDashboard(),
    enabled: hasHandle,
    staleTime: 5 * 60 * 1000,
  });
  const syncedFallback = useMemo<Dashboard | null>(() => {
    if (!p?.codeforces_handle) return null;
    return {
      handle: p.codeforces_handle,
      stats: {
        current: p.cf_rating ?? 0,
        peak: p.cf_max_rating ?? 0,
        contests: 0,
        solved: 0,
        acceptancePct: 0,
        activeDays: 0,
        bestRank: null,
        bestRankContest: null,
        velocityPerWeek: 0,
      },
      ratingHistory: [],
      contestTimeline: [],
      activityMatrix: Array<number>(53 * 7).fill(0),
      difficultyBuckets: [],
      topics: [],
      submissionMix: [],
      submissionTrend: [],
      habitMatrix: Array.from({ length: 7 }, () => Array<number>(24).fill(0)),
      velocity: [],
      languages: [],
      storyItems: [],
    };
  }, [p?.codeforces_handle, p?.cf_rating, p?.cf_max_rating]);
  const backgroundSync = useMutation({
    mutationFn: () => syncSubmissionsFn(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cf-dashboard"] });
    },
  });
  useEffect(() => {
    const handle = p?.codeforces_handle ?? null;
    if (!handle) {
      syncedHandleRef.current = null;
      return;
    }
    if (!dashboardQuery.isFetched || dashboardQuery.isError) return;
    if (syncedHandleRef.current === handle || backgroundSync.isPending) return;
    syncedHandleRef.current = handle;
    backgroundSync.mutate();
  }, [p?.codeforces_handle, dashboardQuery.isFetched, dashboardQuery.isError, backgroundSync]);
  const dashboard = dashboardQuery.data ?? syncedFallback;
  const displayHandle = p?.codeforces_handle ?? p?.display_name ?? "Your profile";
  const cfUrl = p?.codeforces_handle
    ? `https://codeforces.com/profile/${encodeURIComponent(p.codeforces_handle)}`
    : null;
  const handleShareProfile = async () => {
    if (typeof window === "undefined") return;

    const url = p?.codeforces_handle
      ? `${window.location.origin}/u/${encodeURIComponent(p.codeforces_handle)}`
      : window.location.href;
    const title = p?.codeforces_handle ? `${p.codeforces_handle} on Verdiqy` : "Verdiqy profile";
    const text = p?.codeforces_handle
      ? `View ${p.codeforces_handle}'s competitive programming profile.`
      : "View this Verdiqy profile.";

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Could not share profile");
    }
  };
  const handleOpenCodeforces = (url: string) => {
    if (typeof window === "undefined") return;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(url);
  };
  return (
    <AppShell
      breadcrumb={[
        { label: "Workspace", to: "/" },
        { label: "Profile" },
        { label: displayHandle },
      ]}
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => void handleShareProfile()}
          >
            <Share2 className="size-3.5" />
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (cfUrl) {
                handleOpenCodeforces(cfUrl);
                return;
              }
              setEditOpen(true);
            }}
          >
            {cfUrl ? <ExternalLink className="size-3.5" /> : <Link2 className="size-3.5" />}
            {cfUrl ? "View on Codeforces" : "Connect Codeforces"}
          </Button>
        </>
      }
    >
      <DashboardContext.Provider value={dashboard}>
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-6 sm:px-8">
          
          <AboutCard
            profile={p ?? null}
            loading={profileQuery.isLoading}
            onEdit={() => setEditOpen(true)}
            onShare={() => void handleShareProfile()}
          />
          {hasHandle && dashboardQuery.isLoading ? (
            <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
              <Loader2 className="mr-2 inline size-3.5 animate-spin" /> Syncing live Codeforces
              data for {p?.codeforces_handle}…
            </div>
          ) : null}
          <ActivityCard />
          <ExperienceProjectsCard />
          <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={p ?? null} />
          <StatsStrip profile={p ?? null} />

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="sticky top-14 z-20 -mx-6 border-b border-border/70 bg-background/85 px-6 py-2 backdrop-blur sm:-mx-8 sm:px-8">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="contests">Contests</TabsTrigger>
                <TabsTrigger value="problems">Problems</TabsTrigger>
                <TabsTrigger value="habits">Habits</TabsTrigger>
                <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-6 space-y-6 focus-visible:outline-none">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="contests" className="mt-6 space-y-6 focus-visible:outline-none">
              <ContestsTab />
            </TabsContent>
            <TabsContent value="problems" className="mt-6 space-y-6 focus-visible:outline-none">
              <ProblemsTab />
            </TabsContent>
            <TabsContent value="habits" className="mt-6 space-y-6 focus-visible:outline-none">
              <HabitsTab />
            </TabsContent>
            <TabsContent value="bookmarks" className="mt-6 space-y-6 focus-visible:outline-none">
              <BookmarksTab />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardContext.Provider>
    </AppShell>
  );
}


/* ---------- Hero ---------- */

type MyProfile = Awaited<ReturnType<typeof getMyProfile>>;

function ProfileHero({
  profile,
  loading,
  editOpen,
  onEditOpenChange,
}: {
  profile: MyProfile | null;
  loading: boolean;
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
}) {
  const current = profile?.cf_rating ?? 0;
  const peak = profile?.cf_max_rating ?? 0;
  const band = bandFor(current);
  const peakBand = bandFor(peak);
  const handle = profile?.codeforces_handle ?? null;
  const fullName =
    [profile?.cf_first_name, profile?.cf_last_name].filter(Boolean).join(" ").trim() ||
    profile?.display_name ||
    "";
  const location = [profile?.cf_city, profile?.cf_country].filter(Boolean).join(", ");
  const joined = profile?.cf_registered_at
    ? new Date(profile.cf_registered_at).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })
      : "";
  const avatarSrc = profile?.avatar_signed_url ?? profile?.cf_title_photo ?? undefined;
  const initial = (handle ?? fullName ?? "?").charAt(0).toUpperCase();
  const cfUrl = handle ? `https://codeforces.com/profile/${encodeURIComponent(handle)}` : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background: `radial-gradient(600px 200px at 15% 0%, ${band.hex}22, transparent 60%)`,
        }}
      />
      <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start">
        <div className="flex items-center gap-4">
          <Avatar
            className="size-20 ring-2 ring-offset-2 ring-offset-card"
            style={{ boxShadow: `inset 0 0 0 2px ${band.hex}` }}
          >
            {avatarSrc ? <AvatarImage src={avatarSrc} alt={handle ?? "avatar"} /> : null}
            <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
              {loading ? "…" : initial}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1
              className="text-3xl font-semibold tracking-tight"
              style={{ color: handle ? band.hex : undefined }}
            >
              {handle ?? profile?.display_name ?? (loading ? "Loading…" : "Your profile")}
            </h1>
            {fullName ? (
              <span className="text-sm text-muted-foreground">{fullName}</span>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> {location}
              </span>
            ) : null}
            {profile?.cf_organization ? (
              <span className="inline-flex items-center gap-1">
                <Trophy className="size-3" /> {profile.cf_organization}
              </span>
            ) : null}
            {joined ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3" /> Joined {joined}
              </span>
            ) : null}
          </div>
          {handle ? (
            <p className="mt-4 max-w-xl text-sm text-muted-foreground text-pretty">
              <span className="text-foreground capitalize">{profile?.cf_rank ?? band.name}</span>
              {" "}on Codeforces
              {peak && current ? (
                <>
                  {" "}· currently{" "}
                  <span className="text-foreground">
                    {Math.max(0, peak - current)} points
                  </span>{" "}
                  {current >= peak ? "at your peak" : "below your peak"}.
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-4 max-w-xl text-sm text-muted-foreground text-pretty">
              Connect your Codeforces handle to unlock your live rating, contests, and personalized
              analytics.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onEditOpenChange(true)}>
              {handle ? <Pencil className="size-3.5" /> : <Link2 className="size-3.5" />}
              {handle ? "Edit profile" : "Connect Codeforces"}
            </Button>
            {handle ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(handle);
                  toast.success("Handle copied");
                }}
              >
                <Copy className="size-3.5" />
                Copy handle
              </Button>
            ) : null}
            {cfUrl ? (
              <Button size="sm" variant="ghost" asChild>
                <a href={cfUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open on Codeforces
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {handle && current ? (
            <RatingBadge value={current} band={band} label="Current" />
          ) : null}
          {handle && peak ? (
            <RatingBadge value={peak} band={peakBand} label="Peak" muted />
          ) : null}
        </div>
      </div>
      <EditProfileDialog open={editOpen} onOpenChange={onEditOpenChange} profile={profile} />
    </section>
  );
}

function RatingBadge({
  value,
  band,
  label,
  muted,
}: {
  value: number;
  band: Band;
  label: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2 shadow-xs",
        muted && "opacity-80",
      )}
    >
      <div className="leading-tight">
        <p className="text-2xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="tabular text-lg font-semibold" style={{ color: band.hex }}>
          {value}
        </p>
      </div>
      <span
        className="rounded-full px-2 py-0.5 font-mono text-2xs font-medium"
        style={{
          background: `${band.hex}18`,
          color: band.hex,
        }}
      >
        {band.name}
      </span>
    </div>
  );
}

/* ---------- Edit dialog ---------- */

function EditProfileDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: MyProfile | null;
}) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [handle, setHandle] = useState(profile?.codeforces_handle ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [uploading, setUploading] = useState(false);

  const linkFn = useServerFn(linkCodeforcesHandle);
  const unlinkFn = useServerFn(unlinkCodeforcesHandle);
  const updateFn = useServerFn(updateMyProfile);

  useEffect(() => {
    if (!open) return;
    setHandle(profile?.codeforces_handle ?? "");
    setDisplayName(profile?.display_name ?? "");
  }, [open, profile?.codeforces_handle, profile?.display_name]);

  const saveName = useMutation({
    mutationFn: (name: string) => updateFn({ data: { display_name: name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profile"] }),
  });

  const linkMutation = useMutation({
    mutationFn: (h: string) => linkFn({ data: { handle: h } }),
    onSuccess: (res) => {
      toast.success(`Linked ${res.cf.handle} · ${res.cf.rank ?? "unrated"}`);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["cf-dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkFn({ data: undefined }),
    onSuccess: () => {
      toast.success("Codeforces disconnected");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  const onPickFile = () => fileInput.current?.click();

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      toast.error("Use a PNG, JPG, WEBP, or GIF image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB.");
      return;
    }
    setUploading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Please sign in again.");
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${userData.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      await updateFn({ data: { avatar_url: path } });
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your display name, upload an avatar, and connect a real Codeforces handle. We
            verify the handle against codeforces.com before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {profile?.avatar_signed_url || profile?.cf_title_photo ? (
                <AvatarImage
                  src={profile.avatar_signed_url ?? profile.cf_title_photo ?? undefined}
                  alt=""
                />
              ) : null}
              <AvatarFallback className="text-lg">
                {(profile?.codeforces_handle ?? profile?.display_name ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={onFile}
              />
              <Button size="sm" variant="outline" onClick={onPickFile} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
                {uploading ? "Uploading…" : "Upload photo"}
              </Button>
              <p className="text-2xs text-muted-foreground">PNG, JPG, WEBP · up to 4 MB</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                placeholder="How should we call you?"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveName.mutate(displayName.trim())}
                disabled={
                  saveName.isPending ||
                  !displayName.trim() ||
                  displayName.trim() === (profile?.display_name ?? "")
                }
              >
                {saveName.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cf-handle">Codeforces handle</Label>
            <div className="flex gap-2">
              <Input
                id="cf-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                maxLength={40}
                placeholder="e.g. tourist"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                size="sm"
                onClick={() => linkMutation.mutate(handle.trim())}
                disabled={linkMutation.isPending || !handle.trim()}
              >
                {linkMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Link2 className="size-3.5" />
                )}
                Verify & link
              </Button>
            </div>
            <p className="text-2xs text-muted-foreground">
              We fetch{" "}
              <span className="font-mono">codeforces.com/api/user.info</span> — the handle must
              exist.
            </p>
            {profile?.codeforces_handle ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => unlinkMutation.mutate()}
                disabled={unlinkMutation.isPending}
              >
                <Unlink className="size-3.5" />
                Disconnect {profile.codeforces_handle}
              </Button>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Stats strip ---------- */

function StatsStrip({ profile }: { profile: MyProfile | null }) {
  const dash = useDashboard();
  const s = dash?.stats;
  const items = [
    {
      label: "Current rating",
      value: s?.current ?? profile?.cf_rating ?? "—",
      icon: Gauge,
      emoji: "📊",
      color: "text-blue-500",
      hint: profile?.cf_rank ?? (profile?.codeforces_handle ? "Unrated" : "Connect Codeforces"),
    },
    {
      label: "Peak rating",
      value: s?.peak ?? profile?.cf_max_rating ?? "—",
      icon: TrendingUp,
      emoji: "🚀",
      color: "text-purple-500",
      hint: s?.peak ?? profile?.cf_max_rating ? "All-time high" : "—",
    },
    {
      label: "Contests",
      value: s?.contests ?? "—",
      icon: Swords,
      emoji: "⚔️",
      color: "text-red-500",
      hint: s ? `${s.contests} rated` : "Connect Codeforces",
    },
    {
      label: "Problems solved",
      value: s ? s.solved.toLocaleString() : "—",
      icon: Check,
      emoji: "✅",
      color: "text-emerald-500",
      hint: s ? "Unique AC" : "—",
    },
    {
      label: "Acceptance",
      value: s ? `${s.acceptancePct.toFixed(1)}%` : "—",
      icon: Gauge,
      emoji: "🎯",
      color: "text-cyan-500",
      hint: s ? "All submissions" : "—",
    },
    {
      label: "Active days",
      value: s ? `${s.activeDays} / 365` : "—",
      icon: Flame,
      emoji: "🔥",
      color: "text-orange-500",
      hint: s ? `${Math.round((s.activeDays / 365) * 100)}% consistency` : "—",
    },
    {
      label: "Best rank",
      value: s?.bestRank ? `#${s.bestRank}` : "—",
      icon: Trophy,
      emoji: "🏆",
      color: "text-yellow-500",
      hint: s?.bestRankContest ?? "—",
    },
    {
      label: "Velocity",
      value: s ? `${s.velocityPerWeek >= 0 ? "+" : ""}${s.velocityPerWeek} / wk` : "—",
      icon: Zap,
      emoji: "⚡",
      color: "text-primary",
      hint: s ? "4-week avg Δ rating" : "—",
    },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
      {items.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Icon className={cn("size-3.5", s.color)} strokeWidth={2.2} />
              <p className="text-2xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </div>
            <p className="tabular mt-2 flex items-center gap-1.5 text-xl font-semibold tracking-tight">
              <span aria-hidden className="text-lg leading-none">{s.emoji}</span>
              <span>{s.value}</span>
            </p>
            <p className="mt-0.5 text-2xs text-muted-foreground">{s.hint}</p>
          </div>
        );
      })}
    </section>
  );
}


/* ============================================================
 * TAB: Overview — the "at a glance" story
 * ============================================================ */

function OverviewTab() {
  const dash = useDashboard();
  const fullHistory = dash ? dash.ratingHistory : ratingHistory;
  const [range, setRange] = useState<"3m" | "6m" | "1y" | "all">("all");
  const history = useMemo(() => {
    if (range === "all") return fullHistory;
    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
    const cutoff = Date.now() - months * 30 * 24 * 60 * 60 * 1000;
    const filtered = fullHistory.filter((d) => new Date(d.date).getTime() >= cutoff);
    return filtered.length ? filtered : fullHistory;
  }, [fullHistory, range]);
  const stories = dash?.storyItems ?? null;
  const iconFor = (k: "trophy" | "flame" | "star") =>
    k === "trophy" ? Trophy : k === "flame" ? Flame : Star;
  return (
    <>
      <Panel
        title="Rating evolution"
        caption={
          dash
            ? `${history.length} rated contests · colored bands are Codeforces tiers`
            : "Sample data · connect Codeforces to sync"
        }
        icon={TrendingUp}
        right={<RangePicker value={range} onChange={setRange} />}
      >
        <RatingChart data={history} height={280} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Panel
          title="365-day activity"
          caption="Submissions per day · darker = more"
          icon={CalendarDays}
        >
          <ActivityCalendar />
        </Panel>
        <Panel title="Story of the year" caption="Highlights worth savoring" icon={Sparkles}>
          <ul className="space-y-4">
            {dash ? (
              stories && stories.length > 0 ? (
                stories.map((it, i) => (
                  <StoryItem
                    key={i}
                    icon={iconFor(it.icon)}
                    tone={it.tone}
                    headline={it.headline}
                    body={it.body}
                  />
                ))
              ) : (
                <StoryItem
                  icon={Star}
                  tone="success"
                  headline="No highlights synced yet"
                  body="Submit and solve more Codeforces problems to unlock your yearly highlights."
                />
              )
            ) : (
                <>
                  <StoryItem
                    icon={Trophy}
                    tone="primary"
                    headline="Connect Codeforces to see your story"
                    body="We'll surface your peak rating, longest streak, and hardest solved problem."
                  />
                </>
              )}
          </ul>
        </Panel>
      </div>
    </>
  );
}


function StoryItem({
  icon: Icon,
  tone,
  headline,
  body,
}: {
  icon: typeof Trophy;
  tone: "primary" | "warning" | "success";
  headline: string;
  body: string;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "warning"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-success/10 text-success";
  return (
    <li className="flex items-start gap-3">
      <div className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md", toneClass)}>
        <Icon className="size-3.5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-balance">{headline}</p>
        <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{body}</p>
      </div>
    </li>
  );
}

function RangePicker({
  value,
  onChange,
}: {
  value: "3m" | "6m" | "1y" | "all";
  onChange: (v: "3m" | "6m" | "1y" | "all") => void;
}) {
  const options: { k: typeof value; label: string }[] = [
    { k: "3m", label: "3M" },
    { k: "6m", label: "6M" },
    { k: "1y", label: "1Y" },
    { k: "all", label: "All" },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-surface-muted/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.k}
          onClick={() => onChange(o.k)}
          className={cn(
            "h-6 rounded-sm px-2 font-mono text-2xs font-medium transition-colors",
            value === o.k
              ? "bg-surface text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Rating chart with CF bands ---------- */

function RatingChart({ data, height }: { data: typeof ratingHistory; height: number }) {
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No rated contests synced yet.</p>;
  }
  const min = Math.min(...data.map((d) => d.rating)) - 100;
  const max = Math.max(...data.map((d) => d.rating)) + 100;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          {/* Band reference lines */}
          {bands
            .filter((b) => b.min >= min && b.min <= max && b.min > 0)
            .map((b) => (
              <ReferenceLine
                key={b.name}
                y={b.min}
                stroke={b.hex}
                strokeOpacity={0.35}
                strokeDasharray="3 3"
                label={{
                  value: b.name,
                  position: "right",
                  fill: b.hex,
                  fontSize: 10,
                  offset: 6,
                }}
              />
            ))}
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short" })}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <RTooltip
            cursor={{ stroke: "var(--border-strong)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              color: "var(--popover-foreground)",
            }}
          />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="var(--primary)"
            strokeWidth={1.8}
            fill="url(#ratingFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- Activity calendar ---------- */

function ActivityCalendar() {
  const dash = useDashboard();
  const cells = dash ? dash.activityMatrix : activityMatrix;
  const activeDays = dash?.stats.activeDays ?? 246;
  const levelClass = (l: number) =>
    ["bg-surface-muted", "bg-primary/20", "bg-primary/40", "bg-primary/65", "bg-primary"][l];
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  return (
    <div>
      <div className="mb-1.5 grid grid-cols-12 gap-2 pl-6 font-mono text-2xs text-muted-foreground">
        {months.map((m, i) => (
          <span key={`${m}-${i}`}>{m}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-1 font-mono text-2xs text-muted-foreground">
          <span>M</span>
          <span>W</span>
          <span>F</span>
        </div>
        <div className="flex-1">
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {cells.map((v, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "aspect-square w-full rounded-[3px] transition-colors",
                      levelClass(v),
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {v === 0 ? "No submissions" : `Activity level ${v}`}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-2xs text-muted-foreground">
        <span>{activeDays} active days this year</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={cn("size-2.5 rounded-[3px]", levelClass(l))} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * TAB: Contests
 * ============================================================ */

function ContestsTab() {
  const dash = useDashboard();
  const history = dash ? dash.ratingHistory : ratingHistory;
  const timeline = dash ? dash.contestTimeline : contestTimeline;
  const best = timeline.reduce<(typeof timeline)[number] | null>(
    (b, c) => (b === null || c.delta > b.delta ? c : b),
    null,
  );
  const worst = timeline.reduce<(typeof timeline)[number] | null>(
    (b, c) => (b === null || c.delta < b.delta ? c : b),
    null,
  );
  return (
    <>
      <Panel
        title="Rating evolution · detailed"
        caption={dash ? `${history.length} contests total` : "Each dot is a rated contest"}
        icon={TrendingUp}
      >
        <RatingChart data={history} height={320} />
      </Panel>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Recent contests" caption={`All ${timeline.length} rated appearances`} icon={Swords}>
          <ContestTimeline />
        </Panel>
        <Panel
          title="Performance vs expected"
          caption="Above the line = overperformed"
          icon={Target}
        >
          <PerformanceGap />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <MiniStat
              label="Best"
              value={best ? `${best.delta >= 0 ? "+" : ""}${best.delta}` : "—"}
              hint={best?.id ?? undefined}
              tone="success"
            />
            <MiniStat
              label="Worst"
              value={worst ? `${worst.delta >= 0 ? "+" : ""}${worst.delta}` : "—"}
              hint={worst?.id ?? undefined}
              tone="destructive"
            />
          </div>
        </Panel>
      </div>
    </>
  );
}


function ContestTimeline() {
  const dash = useDashboard();
  const list = dash ? dash.contestTimeline : contestTimeline;
  if (list.length === 0) {
    return <p className="text-xs text-muted-foreground">No rated contests synced yet.</p>;
  }
  return (
    <ol className="relative max-h-[560px] divide-y divide-border overflow-y-auto pr-2">
      {list.map((c) => {
        const up = c.delta >= 0;
        return (
          <li
            key={c.id}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{c.id}</p>
                <Badge
                  variant="secondary"
                  className="h-4 border-0 bg-surface-muted px-1.5 font-mono text-2xs"
                >
                  {c.kind}
                </Badge>
              </div>
              <p className="tabular mt-0.5 font-mono text-2xs text-muted-foreground">
                {c.date}
                {c.solved > 0 || c.outOf > 0
                  ? ` · solved ${c.solved}${c.outOf ? `/${c.outOf}` : ""}`
                  : ""}
                {c.rank ? ` · rank #${c.rank}` : ""}
              </p>
            </div>
            <DeltaBar delta={c.delta} />
            <div className="text-right">
              <p className="tabular text-sm font-semibold" style={{ color: bandFor(c.rating).hex }}>
                {c.rating}
              </p>
              <p
                className={cn(
                  "tabular mt-0.5 font-mono text-2xs",
                  up ? "text-success" : "text-destructive",
                )}
              >
                {up ? "+" : ""}
                {c.delta}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DeltaBar({ delta }: { delta: number }) {
  const magnitude = Math.min(80, Math.abs(delta));
  const width = 4 + magnitude * 0.9;
  const up = delta >= 0;
  return (
    <div className="hidden w-24 items-center justify-center sm:flex">
      <div className="flex w-full items-center">
        <div className="flex-1 justify-end pr-1 text-right">
          {!up ? (
            <span
              className="ml-auto block h-1.5 rounded-l-full bg-destructive/70"
              style={{ width }}
            />
          ) : null}
        </div>
        <span className="h-3 w-px bg-border-strong" />
        <div className="flex-1 pl-1">
          {up ? (
            <span className="block h-1.5 rounded-r-full bg-success/70" style={{ width }} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PerformanceGap() {
  const dash = useDashboard();
  const source = dash ? dash.contestTimeline : contestTimeline;
  // Chronological (oldest -> newest); timeline is newest-first
  const data = source
    .slice()
    .reverse()
    .map((c, i) => ({
      i: i + 1,
      name: c.id,
      date: c.date,
      rating: c.rating,
      rank: c.rank,
      actual: c.delta,
    }));
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No contest rating changes synced yet.</p>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="i"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
            allowDecimals={false}
          />
          <ReferenceLine y={0} stroke="var(--border-strong)" />
          <RTooltip
            cursor={{ fill: "var(--surface-muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              color: "var(--popover-foreground)",
            }}
            labelFormatter={(_: unknown, payload: readonly { payload?: unknown }[]) => {
              const p = payload?.[0]?.payload as
                | { name: string; date: string }
                | undefined;
              return p ? `${p.name} · ${p.date}` : "";
            }}
            formatter={(value: unknown, _n: unknown, item: { payload?: unknown }) => {
              const v = Number(value);
              const p = item?.payload as { rank?: number; rating?: number } | undefined;
              const sign = v >= 0 ? "+" : "";
              const extra = p ? ` (rank #${p.rank}, ${p.rating})` : "";
              return [`${sign}${v}${extra}`, "Delta"];
            }}
          />
          <Bar dataKey="actual" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.actual >= 0 ? "var(--success)" : "var(--destructive)"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


/* ============================================================
 * TAB: Problems
 * ============================================================ */

function ProblemsTab() {
  const dash = useDashboard();
  const mix = dash ? dash.submissionMix : submissionMix;
  const accepted = mix.find((s) => s.name === "Accepted")?.value ?? 0;
  const totalMix = mix.reduce((a, b) => a + b.value, 0);
  return (
    <>
      <Panel
        title="Difficulty progression"
        caption="Problems solved by rating bucket · where your ceiling lives"
        icon={Award}
      >
        <DifficultyChart />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Topic mastery" caption={`${(dash ? (dash.topics ?? []) : topics).length} tags · higher = stronger`} icon={Sparkles}>
          <TopicRadar />
        </Panel>
        <Panel
          title="Acceptance breakdown"
          caption={
            totalMix > 0
              ? `${accepted.toLocaleString()} accepted of ${totalMix.toLocaleString()} submissions`
              : "No judged submissions synced yet"
          }
          icon={Check}
        >
          <AcceptanceBreakdown />
        </Panel>
      </div>


      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Favorite problem types" caption="Where you spend your time" icon={Star}>
          <FavoriteTypes />
        </Panel>
        <Panel title="Weak areas" caption="Lowest mastery — biggest upside" icon={TrendingDown}>
          <WeakAreas />
        </Panel>
      </div>
    </>
  );
}

function DifficultyChart() {
  const dash = useDashboard();
  const data = dash ? dash.difficultyBuckets : difficultyBuckets;
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No rated accepted problems synced yet.</p>;
  }
  const frontier = (() => {
    const sorted = [...data].sort((a, b) => Number(b.r) - Number(a.r));
    const above = sorted.find((d) => d.n >= 5);
    return above ? above.r : null;
  })();
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="r"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
            allowDecimals={false}
          />
          <RTooltip
            cursor={{ fill: "var(--surface-muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="n" radius={[3, 3, 0, 0]}>
            {data.map((b, i) => {
              const band = bandFor(Number(b.r));
              return <Cell key={i} fill={band.hex} fillOpacity={0.75} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {frontier ? (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Your solving frontier sits at{" "}
          <span className="text-foreground">{frontier}+</span>. Push harder ratings to raise it.
        </p>
      ) : null}
    </div>
  );
}


function TopicRadar() {
  const dash = useDashboard();
  const data = dash ? (dash.topics ?? []) : topics;
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No tagged accepted problems synced yet.</p>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="tag" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
          <Radar
            name="Mastery"
            dataKey="mastery"
            stroke="var(--primary)"
            strokeWidth={1.5}
            fill="var(--primary)"
            fillOpacity={0.18}
          />
          <RTooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              color: "var(--popover-foreground)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AcceptanceBreakdown() {
  const dash = useDashboard();
  const mix = dash ? dash.submissionMix : submissionMix;
  const langs = dash ? dash.languages : languages;
  const total = mix.reduce((a, b) => a + b.value, 0);
  const accepted = mix.find((s) => s.name === "Accepted")?.value ?? 0;
  const acceptancePct = dash?.stats.acceptancePct ?? (total > 0 ? (accepted / total) * 100 : 0);
  const toneColor = (tone: (typeof mix)[number]["tone"]) =>
    tone === "success"
      ? "var(--success)"
      : tone === "destructive"
        ? "var(--destructive)"
        : tone === "warning"
          ? "var(--warning)"
          : "var(--muted-foreground)";
  if (total === 0) {
    return <p className="text-xs text-muted-foreground">No judged submissions synced yet.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="tabular text-3xl font-semibold tracking-tight">{acceptancePct.toFixed(1)}%</p>
          <p className="text-2xs text-muted-foreground">Overall acceptance</p>
        </div>
        <div className="text-right">
          <p className="tabular text-sm font-semibold text-muted-foreground">
            {total.toLocaleString()}
          </p>
          <p className="text-2xs text-muted-foreground">submissions total</p>
        </div>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {mix.map((s) => (
          <span
            key={s.name}
            style={{ width: `${(s.value / total) * 100}%`, background: toneColor(s.tone) }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-2">
        {mix.map((s) => {
          const pct = ((s.value / total) * 100).toFixed(1);
          return (
            <li key={s.name} className="flex items-center gap-3 text-xs">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: toneColor(s.tone) }}
              />
              <span className="flex-1 truncate">{s.name}</span>
              <span className="tabular text-muted-foreground">{s.value.toLocaleString()}</span>
              <span className="tabular w-10 text-right font-mono text-2xs text-muted-foreground">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-2xs uppercase tracking-wider text-muted-foreground">Language</p>
        <div className="space-y-1.5">
          {langs.length > 0 ? (
            langs.map((l) => (
              <div key={l.name} className="flex items-center gap-2">
                <span className="w-14 text-xs">{l.name}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full bg-primary" style={{ width: `${l.pct}%` }} />
                </div>
                <span className="tabular w-8 text-right font-mono text-2xs text-muted-foreground">
                  {l.pct}%
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No language data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FavoriteTypes() {
  const dash = useDashboard();
  const source = dash ? (dash.topics ?? []) : topics;
  const top = [...source].sort((a, b) => b.solved - a.solved).slice(0, 6);
  if (top.length === 0) return <p className="text-xs text-muted-foreground">No data yet.</p>;
  const max = top[0].solved || 1;
  return (
    <ul className="space-y-2.5">
      {top.map((t, i) => (
        <li key={t.tag} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3">
          <span className="tabular font-mono text-2xs text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{t.tag}</p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full bg-primary transition-[width] duration-500"
                style={{ width: `${(t.solved / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="tabular text-xs text-muted-foreground">{t.solved}</span>
        </li>
      ))}
    </ul>
  );
}

function WeakAreas() {
  const dash = useDashboard();
  const source = dash ? (dash.topics ?? []) : topics;
  const weak = [...source]
    .filter((t) => t.solved > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 5);
  if (weak.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {dash
          ? "Not enough tagged submissions yet. Solve a few problems to surface weak areas."
          : "No data yet."}
      </p>
    );
  }
  const focus = weak[0].tag;
  return (
    <ul className="space-y-3">
      {weak.map((t) => (
        <li
          key={t.tag}
          className="group flex items-center gap-3 rounded-md border border-transparent p-2 -mx-2 transition-colors hover:border-border hover:bg-surface-muted/40"
        >
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-warning/15 text-warning-foreground">
            <X className="size-3.5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t.tag}</p>
            <p className="tabular mt-0.5 text-2xs text-muted-foreground">
              Mastery {t.mastery} · {t.solved} solved
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </li>
      ))}
      <li className="pt-2">
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link to="/problems">
            Generate 30-min drill on <span className="ml-1 font-semibold">{focus}</span>
          </Link>
        </Button>
      </li>

    </ul>
  );
}


/* ============================================================
 * TAB: Habits
 * ============================================================ */

function HabitsTab() {
  const dash = useDashboard();
  const vel = dash ? dash.velocity : velocity;
  const liveHabitTotal = dash
    ? dash.habitMatrix.flat().reduce((sum, value) => sum + value, 0)
    : 0;
  const liveEveningTotal = dash
    ? dash.habitMatrix.reduce(
        (sum, row) => sum + row.slice(19, 24).reduce((a, b) => a + b, 0),
        0,
      )
    : 0;
  const peak = dash
    ? dash.habitMatrix.reduce(
        (best, row, day) =>
          row.reduce(
            (innerBest, value, hour) =>
              value > innerBest.value ? { day, hour, value } : innerBest,
            best,
          ),
        { day: 0, hour: 0, value: 0 },
      )
    : null;
  const habitInsights = dash
    ? liveHabitTotal > 0
      ? [
          {
            t: `Peak window: ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][peak?.day ?? 0]} ${peak?.hour ?? 0}:00`,
            b: `${peak?.value ?? 0} submissions landed in your busiest synced hour.`,
          },
          {
            t: `${Math.round((liveEveningTotal / liveHabitTotal) * 100)}% evening activity`,
            b: "Share of synced submissions between 19:00 and 23:59.",
          },
          {
            t: `${dash.stats.activeDays} active days`,
            b: "Days with at least one synced Codeforces submission in the past year.",
          },
        ]
      : [
          {
            t: "No habit insights yet",
            b: "More synced submissions are needed before Verdiqy can analyze your coding rhythm.",
          },
        ]
    : [
        {
          t: "Connect Codeforces to sync habits",
          b: "Behavioral insights will use your real submission times after your handle is linked.",
        },
      ];
  const best = vel.reduce((b, w) => (w.gain > b.gain ? w : b), vel[0] ?? { w: "-", gain: 0 });
  const sorted = [...vel].map((v) => v.gain).sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  const last4 = vel.slice(-4);
  const risingCount = last4.filter((v) => v.gain > 0).length;
  const momentum = risingCount >= 3 ? "Rising" : risingCount <= 1 ? "Cooling" : "Steady";
  return (
    <>
      <Panel
        title="When you code"
        caption="Submissions by hour × day of week"
        icon={Clock}
      >
        <TimeHeatmap />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Learning velocity" caption={`Weekly rating change · ${vel.length}-week window`} icon={Zap}>
          <VelocityChart />
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <MiniStat
              label="Best week"
              value={`${best.gain >= 0 ? "+" : ""}${best.gain}`}
              hint={best.w}
              tone={best.gain >= 0 ? "success" : "destructive"}
            />
            <MiniStat label="Median" value={`${median >= 0 ? "+" : ""}${median}`} hint="Per week" />
            <MiniStat
              label="Momentum"
              value={momentum}
              hint={`${risingCount}/4 up weeks`}
              tone={momentum === "Rising" ? "success" : momentum === "Cooling" ? "destructive" : undefined}
            />
          </div>
        </Panel>
        <Panel title="Submission trends" caption="Monthly · accepted vs failed" icon={Sparkles}>
          <SubmissionTrend />
        </Panel>
      </div>



      <Panel title="Behavioral insights" caption="What the data suggests" icon={Sparkles}>
        <ul className="grid gap-4 sm:grid-cols-3">
          {habitInsights.map((i) => (
            <li key={i.t} className="rounded-lg border border-border bg-surface-muted/40 p-4">
              <p className="text-sm font-medium text-balance">{i.t}</p>
              <p className="mt-1 text-xs text-muted-foreground text-pretty">{i.b}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

function TimeHeatmap() {
  const dash = useDashboard();
  const matrix = dash ? dash.habitMatrix : habitMatrix;
  if (matrix.length === 0) {
    return <p className="text-xs text-muted-foreground">No submission timing data synced yet.</p>;
  }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const flat = matrix.flat();
  const max = Math.max(1, ...flat);
  const total = flat.reduce((a, b) => a + b, 0);
  const eveningTotal = matrix.reduce(
    (sum, row) => sum + row.slice(19, 24).reduce((a, b) => a + b, 0),
    0,
  );
  const eveningPct = total > 0 ? Math.round((eveningTotal / total) * 100) : 0;
  // find peak cell
  let peakDi = 0;
  let peakHi = 0;
  let peakV = 0;
  matrix.forEach((row, di) =>
    row.forEach((v, hi) => {
      if (v > peakV) {
        peakV = v;
        peakDi = di;
        peakHi = hi;
      }
    }),
  );
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex w-8 flex-col justify-around pt-4 font-mono text-2xs text-muted-foreground">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="mb-1 grid grid-cols-24 font-mono text-2xs text-muted-foreground"
            style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
          >
            {Array.from({ length: 24 }).map((_, h) => (
              <span key={h} className="text-center">
                {h % 3 === 0 ? h : ""}
              </span>
            ))}
          </div>
          <div className="space-y-1">
            {matrix.map((row, di) => (
              <div
                key={di}
                className="grid gap-1"
                style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
              >
                {row.map((v, hi) => {
                  const intensity = v / max;
                  return (
                    <Tooltip key={hi}>
                      <TooltipTrigger asChild>
                        <div
                          className="aspect-square w-full rounded-[3px]"
                          style={{
                            background:
                              intensity < 0.05
                                ? "var(--surface-muted)"
                                : `color-mix(in oklab, var(--primary) ${Math.round(
                                    intensity * 90,
                                  )}%, transparent)`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {days[di]} · {hi}:00 · {v} submissions
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {total > 0 ? (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Peak: <span className="text-foreground">{days[peakDi]} {peakHi}:00</span> ·{" "}
          <span className="text-foreground">{eveningPct}%</span> of submissions between 19:00 and
          23:59.
        </p>
      ) : null}
    </div>
  );
}

function VelocityChart() {
  const dash = useDashboard();
  const data = dash ? dash.velocity : velocity;
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No weekly rating changes synced yet.</p>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="w"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <ReferenceLine y={0} stroke="var(--border-strong)" />
          <RTooltip
            cursor={{ fill: "var(--surface-muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="gain" radius={[3, 3, 3, 3]}>
            {data.map((v, i) => (
              <Cell
                key={i}
                fill={v.gain >= 0 ? "var(--primary)" : "var(--destructive)"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SubmissionTrend() {
  const dash = useDashboard();
  const data = dash ? dash.submissionTrend : submissionTrend;
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No monthly submissions synced yet.</p>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="m"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <RTooltip
            cursor={{ stroke: "var(--border-strong)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              color: "var(--popover-foreground)",
            }}
          />
          <Line
            type="monotone"
            dataKey="accepted"
            stroke="var(--success)"
            strokeWidth={1.8}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="failed"
            stroke="var(--destructive)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 3"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-2xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success" /> Accepted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-destructive" /> Failed
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 * Reusable inside-page primitives
 * ============================================================ */

function Panel({
  title,
  caption,
  icon: Icon,
  right,
  children,
}: {
  title: string;
  caption?: string;
  icon?: typeof Trophy;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <div className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-muted text-muted-foreground">
              <Icon className="size-3.5" strokeWidth={2.2} />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
            {caption ? <p className="truncate text-xs text-muted-foreground">{caption}</p> : null}
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </header>
      {children}
    </section>
  );
}

function MiniStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "destructive";
}) {
  return (
    <div>
      <p className="text-2xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular mt-1 text-lg font-semibold tracking-tight",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-2xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ============================================================
 * AlgoZenith-style layout: Profile Strength, About, Activity, Experience
 * ============================================================ */

function computeStrength(p: MyProfile | null) {
  if (!p) return { pct: 0, missing: "your profile" };
  const checks: Array<{ ok: boolean; label: string }> = [
    { ok: !!(p.avatar_signed_url || p.cf_title_photo), label: "an avatar" },
    { ok: !!p.display_name, label: "your display name" },
    { ok: !!p.codeforces_handle, label: "your Codeforces handle" },
    { ok: !!(p.cf_country || p.cf_city), label: "your location" },
    { ok: !!p.cf_organization, label: "your organization" },
  ];
  const done = checks.filter((c) => c.ok).length;
  const pct = Math.round((done / checks.length) * 100);
  const missing = checks.find((c) => !c.ok)?.label ?? "everything";
  return { pct, missing };
}

function ProfileStrengthCard({
  profile,
  onComplete,
}: {
  profile: MyProfile | null;
  onComplete: () => void;
}) {
  const { pct, missing } = computeStrength(profile);
  const steps = 6;
  return (
    <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.06] via-card to-card p-5 sm:p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            Profile Strength : <span className="tabular">{pct}%</span>
          </h2>
        </div>
        <div className="relative h-1.5 w-full rounded-full bg-border/60">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width]"
            style={{ width: `${pct}%` }}
          />
          {Array.from({ length: steps }).map((_, i) => {
            const left = ((i + 1) / steps) * 100;
            const filled = pct >= left - 1;
            return (
              <span
                key={i}
                className={cn(
                  "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
                  filled
                    ? "border-primary bg-primary"
                    : "border-border bg-background",
                )}
                style={{ left: `${left}%` }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            Add {missing} so that other's can connect with you!
          </p>
          <Button size="sm" onClick={onComplete}>
            Complete Now <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function AboutCard({
  profile,
  loading,
  onEdit,
  onShare,
}: {
  profile: MyProfile | null;
  loading: boolean;
  onEdit: () => void;
  onShare: () => void;
}) {
  const dash = useDashboard();
  const handle = profile?.codeforces_handle ?? null;
  const fullName =
    [profile?.cf_first_name, profile?.cf_last_name].filter(Boolean).join(" ").trim() ||
    profile?.display_name ||
    "";
  const avatarSrc = profile?.avatar_signed_url ?? profile?.cf_title_photo ?? undefined;
  const initial = (handle ?? fullName ?? "?").charAt(0).toUpperCase();
  const org = profile?.cf_organization || "—";
  // Attempts = total submissions from activity mix (fallback to solved)
  const attempts = dash?.submissionMix?.reduce((a, m) => a + (m.value ?? 0), 0) || dash?.stats?.solved || 0;
  // Longest consecutive-day streak the user has visited this site
  const [siteStreak, setSiteStreak] = useState(0);
  useEffect(() => {
    const KEY = "vq.site.visits";
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(KEY);
      const days: string[] = raw ? JSON.parse(raw) : [];
      if (!days.includes(today)) days.push(today);
      days.sort();
      // trim to last 2 years to bound storage
      const trimmed = days.slice(-730);
      localStorage.setItem(KEY, JSON.stringify(trimmed));
      let best = 0, run = 0;
      let prev: number | null = null;
      for (const d of trimmed) {
        const t = new Date(d).getTime();
        if (prev !== null && t - prev === 86_400_000) run += 1;
        else run = 1;
        if (run > best) best = run;
        prev = t;
      }
      setSiteStreak(best);
    } catch {
      setSiteStreak(1);
    }
  }, []);

  // Rating = current Codeforces rating
  const rating = dash?.stats?.current ?? profile?.cf_rating ?? 0;
  const solved = dash?.stats?.solved ?? 0;
  const target = 1000;
  const solvedPct = Math.min(100, Math.round((solved / target) * 100));

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          <span className="mr-1.5" aria-hidden>👋</span> About
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-3.5" /> Edit Profile
          </Button>
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="size-3.5" /> Share Profile
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:items-start">
        {/* Avatar */}
        <Avatar className="size-24 rounded-2xl ring-2 ring-primary/20">
          {avatarSrc ? <AvatarImage src={avatarSrc} alt={handle ?? "avatar"} /> : null}
          <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-500/25 via-fuchsia-400/20 to-amber-300/25 text-3xl font-semibold text-primary">
            {loading ? "…" : initial}
          </AvatarFallback>
        </Avatar>

        {/* Identity */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="text-xl font-semibold tracking-tight">
              {handle ?? profile?.display_name ?? (loading ? "Loading…" : "Your profile")}
            </h3>
            {fullName && fullName !== handle ? (
              <span className="text-sm text-muted-foreground">{fullName}</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="text-foreground underline-offset-2 hover:underline">{org}</span>
            {" · "}
            <span>0 Followers</span>
            {" · "}
            <span>0 Upvotes</span>
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs ring-1 ring-amber-400/30" title="Questions attempted">
              <span aria-hidden>⭐</span>
              <span className="tabular font-semibold text-amber-700 dark:text-amber-300">{attempts}</span>
              <span className="text-muted-foreground">Attempts</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs ring-1 ring-orange-500/30" title="Longest consecutive days visiting Verdiqy">
              <span aria-hidden>🔥</span>
              <span className="tabular font-semibold text-orange-600 dark:text-orange-300">{siteStreak}</span>
              <span className="text-muted-foreground">Max Days</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-1 text-xs ring-1 ring-sky-500/30" title="Current Codeforces rating">
              <span aria-hidden>📊</span>
              <span className="tabular font-semibold text-sky-600 dark:text-sky-300">{rating || 0}</span>
              <span className="text-muted-foreground">Rating</span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">CP Profiles</span>
            <div className="flex items-center gap-1.5">
              <CpProfileIcon
                title="Codeforces"
                href={handle ? `https://codeforces.com/profile/${encodeURIComponent(handle)}` : null}
                active={!!handle}
                tone="rose"
              >
                <Code2 className="size-3.5" />
              </CpProfileIcon>
              <CpProfileIcon title="LeetCode" active={false} tone="amber">
                <BarChart3 className="size-3.5" />
              </CpProfileIcon>
              <CpProfileIcon title="CodeChef" active={false} tone="orange">
                <Trophy className="size-3.5" />
              </CpProfileIcon>
              <CpProfileIcon title="AtCoder" active={false} tone="slate">
                <Rocket className="size-3.5" />
              </CpProfileIcon>
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="flex flex-col items-center justify-center gap-2 md:mx-4">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-2xs font-medium uppercase tracking-wider text-primary">
            On Verdiqy
          </span>
          <DonutStat value={solvedPct} label="Problems" number={solved} />
        </div>

        {/* Links */}
        <div className="min-w-[180px]">
          <p className="text-sm font-semibold">🔗 Links</p>
          <div className="mt-3">
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">Work</p>
            <div className="mt-2 flex items-center gap-2">
              <LinkChip title="GitHub" tone="slate"><Github className="size-3.5" /></LinkChip>
              <LinkChip title="Website" tone="emerald"><Globe className="size-3.5" /></LinkChip>
              <LinkChip title="LinkedIn" tone="sky"><Linkedin className="size-3.5" /></LinkChip>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">Social</p>
            <div className="mt-2 flex items-center gap-2">
              <LinkChip title="Twitter" tone="sky"><Twitter className="size-3.5" /></LinkChip>
              <LinkChip title="Instagram" tone="pink"><Instagram className="size-3.5" /></LinkChip>
              <LinkChip title="Facebook" tone="indigo"><Facebook className="size-3.5" /></LinkChip>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ChipTone = "rose" | "amber" | "orange" | "slate" | "sky" | "emerald" | "pink" | "indigo";

const TONE_ACTIVE: Record<ChipTone, string> = {
  rose: "border-rose-400/40 bg-rose-500/15 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25",
  amber: "border-amber-400/40 bg-amber-400/20 text-amber-700 dark:text-amber-300 hover:bg-amber-400/30",
  orange: "border-orange-400/40 bg-orange-500/15 text-orange-600 dark:text-orange-300 hover:bg-orange-500/25",
  slate: "border-slate-400/40 bg-slate-500/15 text-slate-700 dark:text-slate-200 hover:bg-slate-500/25",
  sky: "border-sky-400/40 bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500/25",
  emerald: "border-emerald-400/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25",
  pink: "border-pink-400/40 bg-pink-500/15 text-pink-600 dark:text-pink-300 hover:bg-pink-500/25",
  indigo: "border-indigo-400/40 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25",
};

function CpProfileIcon({
  children,
  href,
  active,
  title,
  tone = "slate",
}: {
  children: React.ReactNode;
  href?: string | null;
  active: boolean;
  title: string;
  tone?: ChipTone;
}) {
  const cls = cn(
    "inline-flex size-7 items-center justify-center rounded-md border transition",
    active
      ? TONE_ACTIVE[tone]
      : "border-dashed border-border/60 bg-muted/30 text-muted-foreground/60",
  );
  if (active && href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" title={title} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <span title={title} className={cls}>
      {children}
    </span>
  );
}

function LinkChip({
  title,
  children,
  tone = "slate",
}: {
  title: string;
  children: React.ReactNode;
  tone?: ChipTone;
}) {
  const storageKey = `vq.profile.link.${title.toLowerCase()}`;
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    try {
      setUrl(localStorage.getItem(storageKey));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const normalize = (raw: string) => {
    const v = raw.trim();
    if (!v) return "";
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  };

  const promptForUrl = () => {
    const current = url ?? "";
    const next = window.prompt(`${current ? "Edit" : "Add"} your ${title} link`, current);
    if (next === null) return; // cancelled
    const trimmed = next.trim();
    try {
      if (!trimmed) {
        localStorage.removeItem(storageKey);
        setUrl(null);
        toast.success(`${title} link removed`);
      } else {
        const clean = normalize(trimmed);
        localStorage.setItem(storageKey, clean);
        setUrl(clean);
        toast.success(`${title} link saved`);
      }
    } catch {
      toast.error("Couldn't save link");
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey || !url) {
      e.preventDefault();
      promptForUrl();
    }
  };

  const cls = cn(
    "relative inline-flex size-8 items-center justify-center rounded-full border transition",
    url ? TONE_ACTIVE[tone] : "border-dashed border-border/60 bg-muted/30 text-muted-foreground/70 hover:bg-muted/50",
  );

  const dot = url ? (
    <span
      aria-hidden
      className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background"
    />
  ) : null;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          promptForUrl();
        }}
        title={`Open ${title} · Shift-click or right-click to edit`}
        className={cls}
      >
        {children}
        {dot}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={promptForUrl}
      title={`Add your ${title} link`}
      className={cls}
    >
      {children}
    </button>
  );
}


function DonutStat({ value, label, number }: { value: number; label: string; number: number }) {
  const size = 120;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-[stroke-dasharray]"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-semibold leading-none">{number}</span>
        <span className="mt-1 text-2xs uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function ActivityCard() {
  const dash = useDashboard();
  const matrix = dash?.activityMatrix ?? Array<number>(53 * 7).fill(0);
  const streak = dash?.stats?.activeDays ?? 0;
  const [year, setYear] = useState(new Date().getFullYear());
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Mon","Wed","Fri"];
  const shades = [
    "bg-muted/40",
    "bg-emerald-200 dark:bg-emerald-900/40",
    "bg-emerald-400 dark:bg-emerald-700",
    "bg-emerald-500 dark:bg-emerald-500",
    "bg-emerald-600 dark:bg-emerald-400",
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          <span className="mr-1.5" aria-hidden>📅</span> Your Activity
        </h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-2.5 py-1 ring-1 ring-orange-500/25">
            <span aria-hidden>🔥</span>
            <span className="tabular font-semibold text-orange-600 dark:text-orange-300">{streak} Days</span>
            <span className="text-muted-foreground">Active Streak</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-2.5 py-1 ring-1 ring-indigo-500/25">
            <span aria-hidden>🚀</span>
            <span className="tabular font-semibold text-indigo-600 dark:text-indigo-300">{streak} Days</span>
            <span className="text-muted-foreground">Longest Streak</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="ml-8 grid grid-cols-12 text-2xs text-muted-foreground">
            {months.map((m) => <span key={m}>{m}</span>)}
          </div>
          <div className="mt-1 flex gap-2">
            <div className="flex w-6 flex-col justify-between py-1 text-2xs text-muted-foreground">
              {days.map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
              {matrix.map((v, i) => (
                <span
                  key={i}
                  className={cn("size-[10px] rounded-[2px]", shades[Math.min(4, v)])}
                  title={`${v} contributions`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
        >
          {[year, year - 1, year - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
          <span>Less</span>
          {shades.map((s, i) => (
            <span key={i} className={cn("size-3 rounded-[2px]", s)} />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}

const PROJECT_TYPES = [
  { id: "frontend", label: "Frontend", icon: "🖥️", tint: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/30" },
  { id: "backend", label: "Backend", icon: "🗄️", tint: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30" },
  { id: "fullstack", label: "Full Stack", icon: "🧱", tint: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30" },
  { id: "aiml", label: "AI/ML", icon: "🧠", tint: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-500/30" },
  { id: "general", label: "General", icon: "{ }", tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30" },
] as const;

const TAG_OPTIONS = ["React", "Next.js", "TypeScript", "Node.js", "Python", "TailwindCSS", "PostgreSQL", "MongoDB", "GraphQL", "AWS", "Docker", "TensorFlow", "PyTorch", "Rust", "Go"];

type ProjectItem = {
  id: string;
  title: string;
  hosted: "yes" | "no" | null;
  github: string;
  website: string;
  isJob: "yes" | "no" | null;
  company: string;
  startDate: string;
  endDate: string;
  type: string;
  tags: string[];
  description: string;
};

const STORAGE_KEY = "profile.projects.v1";

function useProjects() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  const save = (next: ProjectItem[]) => {
    setItems(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  return {
    items,
    add: (p: ProjectItem) => save([p, ...items]),
    remove: (id: string) => save(items.filter((x) => x.id !== id)),
  };
}

function ExperienceProjectsCard() {
  const { items, add, remove } = useProjects();
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          <span className="mr-1.5" aria-hidden>💼</span> Experience &amp; Projects
        </h2>
        {items.length > 0 ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <ArrowRight className="size-3.5" /> Add Project
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-fuchsia-500/5 p-8 text-center">
          <div className="mx-auto flex w-fit items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/30" aria-hidden>📊</span>
            <span className="grid size-9 place-items-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500/30" aria-hidden>🗂️</span>
            <span className="grid size-9 place-items-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30" aria-hidden>🧩</span>
            <span className="grid size-9 place-items-center rounded-lg bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 ring-1 ring-fuchsia-500/30" aria-hidden>{`{}`}</span>
          </div>
          <p className="mt-3 text-sm font-semibold">The more, the merrier ✨</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Projects on a resume demonstrate practical application of skills, showcasing your
            ability to solve real-world problems to potential employers.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setOpen(true)}>
            <ArrowRight className="size-3.5" /> Add Project
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((p) => {
            const t = PROJECT_TYPES.find((x) => x.id === p.type) ?? PROJECT_TYPES[4];
            return (
              <div key={p.id} className="group rounded-xl border border-border/70 bg-gradient-to-br from-background to-surface-muted/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg ring-1 text-base font-semibold", t.tint)} aria-hidden>{t.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="truncate text-sm font-semibold">{p.title}</h3>
                        <span className={cn("rounded-full px-2 py-0.5 text-2xs font-medium ring-1", t.tint)}>{t.label}</span>
                        {p.isJob === "yes" && p.company ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-medium text-primary ring-1 ring-primary/20">@ {p.company}</span>
                        ) : null}
                      </div>
                      {(p.startDate || p.endDate) ? (
                        <p className="mt-0.5 text-2xs text-muted-foreground">
                          {p.startDate || "—"} → {p.endDate || "Present"}
                        </p>
                      ) : null}
                      {p.description ? (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{p.description}</p>
                      ) : null}
                      {p.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.tags.map((tag) => (
                            <span key={tag} className="rounded-md bg-surface-muted px-1.5 py-0.5 text-2xs text-muted-foreground">#{tag}</span>
                          ))}
                        </div>
                      ) : null}
                      {(p.github || p.website) ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.github ? (
                            <a href={p.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 px-2 py-0.5 text-2xs font-medium text-slate-700 ring-1 ring-slate-500/20 hover:bg-slate-500/15 dark:text-slate-300">
                              <Github className="size-3" /> GitHub
                            </a>
                          ) : null}
                          {p.website ? (
                            <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-2xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15 dark:text-emerald-300">
                              <Globe className="size-3" /> Live
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100" aria-label="Remove project" onClick={() => remove(p.id)}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddProjectDialog open={open} onOpenChange={setOpen} onAdd={(p) => { add(p); setOpen(false); toast.success("Project added"); }} />
    </section>
  );
}

function AddProjectDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (p: ProjectItem) => void }) {
  const [title, setTitle] = useState("");
  const [hosted, setHosted] = useState<"yes" | "no" | null>(null);
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [isJob, setIsJob] = useState<"yes" | "no" | null>(null);
  const [company, setCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle(""); setHosted(null); setGithub(""); setWebsite(""); setIsJob(null);
      setCompany(""); setStartDate(""); setEndDate(""); setType(""); setTags([]); setDescription("");
    }
  }, [open]);

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const canSubmit = title.trim().length > 0;

  const submit = () => {
    if (!canSubmit) {
      toast.error("Please enter a project title");
      return;
    }
    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      hosted, github: github.trim(), website: website.trim(),
      isJob, company: company.trim(),
      startDate, endDate,
      type: type || "general",
      tags,
      description: description.trim(),
    });
  };


  const YesNo = ({ value, onChange }: { value: "yes" | "no" | null; onChange: (v: "yes" | "no") => void }) => (
    <div className="flex items-center gap-4">
      {(["yes", "no"] as const).map((v) => (
        <label key={v} className="flex cursor-pointer items-center gap-1.5 text-sm">
          <input type="radio" checked={value === v} onChange={() => onChange(v)} className="accent-primary" />
          <span className="capitalize">{v}</span>
        </label>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Project</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="proj-title"><span className="text-rose-500">*</span> Title</Label>
            <Input id="proj-title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Is the project hosted?</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-2xs font-medium text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300">
                <Github className="size-3" /> <Globe className="size-3" /> Projects with links are 10X more Valuable!
              </span>
            </div>
            <YesNo value={hosted} onChange={setHosted} />
          </div>

          {hosted === "yes" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="proj-gh">Github</Label>
                <Input id="proj-gh" placeholder="Github" value={github} onChange={(e) => setGithub(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="proj-web">Website</Label>
                <Input id="proj-web" placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm">Was this part of a job/Internship?</span>
            <YesNo value={isJob} onChange={setIsJob} />
          </div>

          {isJob === "yes" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="proj-co">Company</Label>
              <Input id="proj-co" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="proj-start">Start Date</Label>
              <Input id="proj-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="proj-end">End Date</Label>
              <Input id="proj-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROJECT_TYPES.map((t) => {
                const active = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50 hover:bg-surface-muted/40",
                    )}
                  >
                    <span className={cn("grid size-9 place-items-center rounded-md ring-1 text-base font-semibold", t.tint)} aria-hidden>{t.icon}</span>
                    <span className="font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-2 min-h-11">
              {tags.length === 0 ? (
                <span className="px-1.5 py-1 text-xs text-muted-foreground">select tags from here…</span>
              ) : (
                tags.map((tag) => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20">
                    {tag} <X className="size-3" />
                  </button>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.filter((t) => !tags.includes(t)).map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className="rounded-md bg-surface-muted px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="proj-desc">Description</Label>
            <textarea
              id="proj-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you build? What did you learn?"
              className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            <span className="mr-1">+</span> Add Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Bookmarks tab (synced with sheet detail pages) ----------------

interface ProfileBookmark {
  problemKey: string;
  name: string;
  url: string;
  rating: number | null;
  tags: string[];
  sheetId: string;
  sheetName: string;
  bookmarkedAt: number;
}

function BookmarksTab() {
  const [bookmarks, setBookmarks] = useState<ProfileBookmark[]>([]);

  const load = () => {
    try {
      const raw = localStorage.getItem("verdiqy.bookmarks");
      setBookmarks(raw ? (JSON.parse(raw) as ProfileBookmark[]) : []);
    } catch {
      setBookmarks([]);
    }
  };

  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "verdiqy.bookmarks") load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const remove = (problemKey: string, sheetId: string) => {
    const next = bookmarks.filter(
      (b) => !(b.problemKey === problemKey && b.sheetId === sheetId),
    );
    setBookmarks(next);
    try {
      localStorage.setItem("verdiqy.bookmarks", JSON.stringify(next));
      // also flip the sheet-progress flag so the source stays in sync
      const pKey = `verdiqy.sheet-progress.${sheetId}`;
      const raw = localStorage.getItem(pKey);
      if (raw) {
        const progress = JSON.parse(raw) as Record<
          string,
          { done: boolean; note: string; bookmarked: boolean }
        >;
        if (progress[problemKey]) {
          progress[problemKey].bookmarked = false;
          localStorage.setItem(pKey, JSON.stringify(progress));
        }
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">
            Bookmarked problems
          </div>
          <h3 className="font-display text-lg font-semibold">
            My bookmarks{" "}
            {bookmarks.length ? (
              <span className="text-muted-foreground">({bookmarks.length})</span>
            ) : null}
          </h3>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/cheatsheets">Go to Cheat Library</Link>
        </Button>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-surface/30 p-6 text-center text-sm text-muted-foreground">
          No bookmarks yet. Open a sheet from your Cheat Library and tap the
          bookmark icon on any problem — it shows up here.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {bookmarks.map((b) => (
            <li
              key={`${b.sheetId}:${b.problemKey}`}
              className="flex items-start gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-medium hover:underline"
                >
                  {b.name}
                </a>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs text-muted-foreground">
                  {b.rating != null && (
                    <span className="rounded-full border border-border/50 px-1.5 py-0.5 tabular-nums">
                      {b.rating}
                    </span>
                  )}
                  <Link
                    to="/sheets/$sheetId"
                    params={{ sheetId: b.sheetId }}
                    className="rounded-full bg-primary/10 px-1.5 py-0.5 text-primary hover:underline"
                  >
                    {b.sheetName}
                  </Link>
                  {b.tags.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full bg-muted/50 px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                  <span>
                    · {new Date(b.bookmarkedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => remove(b.problemKey, b.sheetId)}
                aria-label="Remove bookmark"
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

