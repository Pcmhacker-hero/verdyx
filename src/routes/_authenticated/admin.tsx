import { createFileRoute } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleDot,
  Copy,
  CreditCard,
  Download,
  Filter,
  Flag,
  Gauge,
  Globe,
  LineChart as LineIcon,
  MessageSquare,
  MoreHorizontal,
  Radar,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { seededRandom } from "@/lib/rand";

const rng = seededRandom(0xa17a5);

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Verdiqx" },
      {
        name: "description",
        content:
          "Production admin dashboard for Verdiqx — analytics, revenue, subscriptions, contests, recommendations, search, feedback, monitoring, and feature flags.",
      },
      { property: "og:title", content: "Admin · Verdiqx" },
      {
        property: "og:description",
        content:
          "Operate Verdiqx end-to-end: growth, MRR, cohorts, incidents, and feature rollouts — all in one place.",
      },
    ],
  }),
  component: AdminPage,
});

/* =============================================================
 * PRIMITIVES
 * ============================================================= */

function Section({
  title,
  desc,
  right,
  children,
  id,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {desc ? <p className="text-xs text-muted-foreground">{desc}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card text-card-foreground shadow-[0_1px_0_rgba(0,0,0,0.02)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Delta({ v, unit = "%" }: { v: number; unit?: string }) {
  const up = v >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-2xs font-medium",
        up
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      )}
    >
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(v).toFixed(1)}
      {unit}
    </span>
  );
}

function Metric({
  label,
  value,
  delta,
  hint,
  spark,
  accent,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  spark?: number[];
  accent?: "primary" | "emerald" | "violet" | "amber";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {delta !== undefined ? <Delta v={delta} /> : null}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      </div>
      {hint ? <p className="mt-0.5 text-2xs text-muted-foreground">{hint}</p> : null}
      {spark ? (
        <div className="mt-3">
          <Spark data={spark} accent={accent} />
        </div>
      ) : null}
    </Card>
  );
}

function Spark({
  data,
  accent = "primary",
  height = 34,
}: {
  data: number[];
  accent?: "primary" | "emerald" | "violet" | "amber";
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const w = 100;
  const step = w / (data.length - 1);
  const pts = data
    .map((v, i) => `${(i * step).toFixed(2)},${(height - ((v - min) / range) * height).toFixed(2)}`)
    .join(" ");
  const area = `0,${height} ${pts} ${w},${height}`;
  const color =
    accent === "emerald"
      ? "text-emerald-500"
      : accent === "violet"
        ? "text-violet-500"
        : accent === "amber"
          ? "text-amber-500"
          : "text-primary";
  const id = useId();
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-9 w-full", color)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =============================================================
 * DATA
 * ============================================================= */

const spark = (n: number, base = 40, jitter = 14, drift = 0.6) =>
  Array.from({ length: n }, (_, i) => Math.round(base + i * drift + Math.sin(i * 0.9) * jitter));

const REVENUE_SERIES = [
  132, 141, 138, 156, 172, 168, 181, 194, 189, 210, 224, 218, 236, 251, 244, 268, 275, 292, 288,
  314, 328, 336, 351, 344, 372, 388, 401, 397, 418, 432,
];

const NEW_USERS = spark(30, 220, 60, 3.2);
const ACTIVE_USERS = spark(30, 5200, 320, 42);
const CHURN = [3.1, 2.9, 3.0, 2.7, 2.6, 2.6, 2.4, 2.3, 2.5, 2.1, 2.0, 1.9];

/* =============================================================
 * PAGE
 * ============================================================= */

function AdminPage() {
  const [range, setRange] = useState<"24h" | "7d" | "30d" | "90d">("30d");

  return (
    <AppShell
      breadcrumb={[{ label: "Admin" }, { label: "Overview" }]}
      actions={
        <>
          <Button variant="ghost" size="sm" className="hidden gap-1.5 md:inline-flex">
            <Download className="size-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5">
            <Sparkles className="size-3.5" /> New report
          </Button>
        </>
      }
    >
      <TopBar range={range} setRange={setRange} />

      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-6 md:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <SideNav />

        <div className="min-w-0 space-y-10">
          <Overview />
          <RevenuePanel />
          <SubscriptionsPanel />
          <UsersPanel />
          <ContestsPanel />
          <ContentPanel />
          <RecommendationsPanel />
          <SearchPanel />
          <FeedbackPanel />
          <MonitoringPanel />
          <FlagsPanel />
        </div>
      </div>
    </AppShell>
  );
}

/* =============================================================
 * TOP BAR — Stripe-like environment toggle + range
 * ============================================================= */

function TopBar({
  range,
  setRange,
}: {
  range: "24h" | "7d" | "30d" | "90d";
  setRange: (r: "24h" | "7d" | "30d" | "90d") => void;
}) {
  const [env, setEnv] = useState<"live" | "test">("live");
  return (
    <div className="border-b border-border/70 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-1 rounded-md border border-border/70 bg-surface-muted/60 p-0.5">
          {(["live", "test"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setEnv(e)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-2xs font-medium capitalize transition-colors",
                env === e
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CircleDot
                className={cn("size-2.5", e === "live" ? "text-emerald-500" : "text-amber-500")}
              />
              {e === "live" ? "Live data" : "Test mode"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users, invoices, flags, cheat sheets…"
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-md border border-border/70 bg-surface-muted/60 p-0.5">
          {(["24h", "7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded px-2 py-1 font-mono text-2xs uppercase transition-colors",
                range === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
          <Filter className="size-3.5" /> Filter
        </Button>
      </div>
    </div>
  );
}

/* =============================================================
 * SIDE NAV — anchor sections
 * ============================================================= */

function SideNav() {
  const items = [
    { id: "overview", label: "Overview", Icon: Gauge },
    { id: "revenue", label: "Revenue", Icon: CreditCard },
    { id: "subs", label: "Subscriptions", Icon: Users },
    { id: "users", label: "Users & growth", Icon: Activity },
    { id: "contests", label: "Contests", Icon: Trophy },
    { id: "content", label: "Cheat sheets", Icon: BookOpen },
    { id: "recs", label: "Recommendations", Icon: Radar },
    { id: "search", label: "Search analytics", Icon: Wand2 },
    { id: "feedback", label: "Feedback", Icon: MessageSquare },
    { id: "monitoring", label: "Monitoring", Icon: Shield },
    { id: "flags", label: "Feature flags", Icon: Flag },
  ];
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[7.5rem] space-y-0.5">
        <p className="px-2 pb-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
          Sections
        </p>
        {items.map(({ id, label, Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className="group flex h-8 items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <Icon className="size-3.5 opacity-80 transition-transform group-hover:scale-110" />
            <span className="flex-1 truncate">{label}</span>
            <ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
          </a>
        ))}
      </div>
    </aside>
  );
}

/* =============================================================
 * OVERVIEW
 * ============================================================= */

function Overview() {
  return (
    <Section
      id="overview"
      title="Today at a glance"
      desc="Live metrics across the platform. Updated 12s ago."
      right={
        <div className="flex items-center gap-2 text-2xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative size-2 rounded-full bg-emerald-500" />
            </span>
            All systems normal
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          label="MRR"
          value="$132,480"
          delta={8.4}
          hint="+$10.2K vs last month"
          spark={REVENUE_SERIES.slice(-14)}
          accent="emerald"
        />
        <Metric
          label="Active users"
          value="48,219"
          delta={4.2}
          hint="DAU · 7-day avg"
          spark={ACTIVE_USERS.slice(-14)}
          accent="primary"
        />
        <Metric
          label="New signups"
          value="1,284"
          delta={12.7}
          hint="Last 24 hours"
          spark={NEW_USERS.slice(-14)}
          accent="violet"
        />
        <Metric
          label="Net churn"
          value="1.9%"
          delta={-0.4}
          hint="Rolling 30 days"
          spark={CHURN}
          accent="amber"
        />
      </div>
    </Section>
  );
}

/* =============================================================
 * REVENUE
 * ============================================================= */

function RevenuePanel() {
  const bars = REVENUE_SERIES;
  const max = Math.max(...bars);
  return (
    <Section
      id="revenue"
      title="Revenue"
      desc="Gross volume, net of refunds and disputes."
      right={
        <div className="flex items-center gap-2 text-2xs">
          <Legend swatch="bg-primary" label="Gross" />
          <Legend swatch="bg-emerald-500" label="Net" />
          <Legend swatch="bg-muted-foreground/40" label="Prev period" />
        </div>
      }
    >
      <Card className="p-5">
        <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div>
              <p className="text-2xs uppercase tracking-[0.14em] text-muted-foreground">
                Gross volume
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">$412,308</p>
              <div className="mt-1 flex items-center gap-2">
                <Delta v={11.2} />
                <span className="text-2xs text-muted-foreground">vs $370,842</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Net" value="$389,120" />
              <MiniStat label="Refunds" value="$4,281" />
              <MiniStat label="Disputes" value="$1,120" />
              <MiniStat label="Fees" value="$17,787" />
            </div>
          </div>
          <div>
            <div className="flex h-40 items-end gap-1">
              {bars.map((v, i) => (
                <div key={i} className="group relative flex-1">
                  <div
                    className="w-full rounded-sm bg-primary/80 transition-colors group-hover:bg-primary"
                    style={{ height: `${(v / max) * 100}%` }}
                  />
                  <div
                    className="mt-0.5 w-full rounded-sm bg-emerald-500/60"
                    style={{ height: `${((v * 0.92) / max) * 22}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-2xs text-muted-foreground">
              <span>Jun 14</span>
              <span>Jun 28</span>
              <span>Jul 14</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-border/60 pt-5 md:grid-cols-3">
          <BreakdownRow label="Pro monthly" amount="$208,410" pct={51} />
          <BreakdownRow label="Pro annual" amount="$156,220" pct={38} color="emerald" />
          <BreakdownRow label="Team" amount="$47,678" pct={11} color="violet" />
        </div>
      </Card>
    </Section>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-2 rounded-sm", swatch)} />
      {label}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-surface-muted/40 p-2.5">
      <p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  amount,
  pct,
  color = "primary",
}: {
  label: string;
  amount: string;
  pct: number;
  color?: "primary" | "emerald" | "violet";
}) {
  const bg =
    color === "emerald" ? "bg-emerald-500" : color === "violet" ? "bg-violet-500" : "bg-primary";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{amount}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div className={cn("h-full", bg)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-2xs text-muted-foreground">{pct}% of gross</p>
    </div>
  );
}

/* =============================================================
 * SUBSCRIPTIONS
 * ============================================================= */

function SubscriptionsPanel() {
  const plans = [
    { name: "Free", users: 38210, mrr: 0, delta: 6.1, color: "bg-muted-foreground/50" },
    { name: "Pro", users: 8412, mrr: 84120, delta: 9.4, color: "bg-primary" },
    { name: "Pro Annual", users: 2104, mrr: 43108, delta: 14.2, color: "bg-emerald-500" },
    { name: "Team", users: 214, mrr: 5252, delta: 3.1, color: "bg-violet-500" },
  ];
  return (
    <Section id="subs" title="Subscriptions" desc="Plan mix, upgrades, and churn.">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-muted/40 text-2xs uppercase tracking-[0.1em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Plan</th>
                <th className="px-4 py-2 text-right font-medium">Users</th>
                <th className="px-4 py-2 text-right font-medium">MRR</th>
                <th className="px-4 py-2 text-right font-medium">Growth</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.name} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-sm", p.color)} />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {p.users.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    ${p.mrr.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Delta v={p.delta} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="size-7" aria-label="Row actions">
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>

        <Card className="p-4">
          <p className="text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Cohort retention
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            89.2% <span className="text-2xs font-normal text-muted-foreground">30-day</span>
          </p>
          <CohortGrid />
          <p className="mt-2 text-2xs text-muted-foreground">
            Weekly cohorts · retention shaded by strength
          </p>
        </Card>
      </div>
    </Section>
  );
}

function CohortGrid() {
  const rows = 6;
  const cols = 10;
  return (
    <div
      className="mt-3 grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const base = Math.max(0.08, 0.92 - col * 0.07 - row * 0.02 + (Math.sin(i) + 1) * 0.03);
        return (
          <div
            key={i}
            className="aspect-square rounded-[3px] bg-primary"
            style={{ opacity: base }}
            title={`Week ${col + 1}: ${(base * 100).toFixed(0)}%`}
          />
        );
      })}
    </div>
  );
}

/* =============================================================
 * USERS & GROWTH
 * ============================================================= */

function UsersPanel() {
  return (
    <Section id="users" title="User analytics" desc="Signups, activation, and engagement.">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric
          label="Signups (30d)"
          value="38,412"
          delta={12.7}
          spark={NEW_USERS}
          accent="violet"
        />
        <Metric
          label="Activated"
          value="24,108"
          delta={5.3}
          hint="Solved ≥ 3 problems"
          spark={spark(30, 180, 30, 2.4)}
          accent="emerald"
        />
        <Metric label="D7 retention" value="62.8%" delta={2.1} spark={spark(30, 55, 6, 0.3)} />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Growth funnel</h3>
            <p className="text-2xs text-muted-foreground">Last 30 days · desktop + mobile web</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <BarChart3 className="size-3.5" /> Compare periods
          </Button>
        </div>
        <div className="space-y-2">
          <FunnelStep label="Visit landing" value={412_308} pct={100} />
          <FunnelStep label="Sign up" value={38_412} pct={9.3} />
          <FunnelStep label="Solve first problem" value={24_108} pct={5.8} />
          <FunnelStep label="Return day 7" value={15_140} pct={3.7} />
          <FunnelStep label="Convert to Pro" value={2_412} pct={0.58} color="emerald" />
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Top countries</p>
            <Globe className="size-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-2.5">
            {[
              { c: "India", u: 12_140, p: 31.6 },
              { c: "United States", u: 6_820, p: 17.7 },
              { c: "China", u: 4_281, p: 11.1 },
              { c: "Russia", u: 3_120, p: 8.1 },
              { c: "Brazil", u: 2_048, p: 5.3 },
              { c: "Germany", u: 1_842, p: 4.8 },
            ].map((r) => (
              <div key={r.c}>
                <div className="flex items-center justify-between text-xs">
                  <span>{r.c}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {r.u.toLocaleString()} · {r.p}%
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${r.p * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold">Engagement heatmap</p>
          <ActivityHeatmap />
          <p className="mt-2 text-2xs text-muted-foreground">
            Sessions per hour · last 4 weeks · UTC
          </p>
        </Card>
      </div>
    </Section>
  );
}

function FunnelStep({
  label,
  value,
  pct,
  color = "primary",
}: {
  label: string;
  value: number;
  pct: number;
  color?: "primary" | "emerald";
}) {
  const bg = color === "emerald" ? "bg-emerald-500/80" : "bg-primary/80";
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="relative flex-1 overflow-hidden rounded-md bg-surface-muted/60">
        <div className={cn("h-8", bg)} style={{ width: `${Math.max(6, pct)}%` }} />
        <span className="absolute inset-0 flex items-center px-3 text-xs font-medium tabular-nums text-foreground/90 mix-blend-luminosity">
          {value.toLocaleString()}
        </span>
      </div>
      <span className="w-14 shrink-0 text-right font-mono text-2xs text-muted-foreground">
        {pct}%
      </span>
    </div>
  );
}

function ActivityHeatmap() {
  const days = 7;
  const hours = 24;
  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${hours}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: days * hours }).map((_, i) => {
        const h = i % hours;
        const d = Math.floor(i / hours);
        const peak =
          Math.exp(-Math.pow((h - 19) / 5, 2)) + Math.exp(-Math.pow((h - 9) / 4, 2)) * 0.6;
        const weekend = d >= 5 ? 1.2 : 1;
        const v = Math.min(1, peak * weekend * (0.7 + rng() * 0.3));
        return (
          <div
            key={i}
            className="aspect-square rounded-[2px] bg-primary"
            style={{ opacity: 0.08 + v * 0.82 }}
            title={`${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]} ${h}:00`}
          />
        );
      })}
    </div>
  );
}

/* =============================================================
 * CONTESTS
 * ============================================================= */

function ContestsPanel() {
  const rows = [
    {
      name: "Weekly Round #142",
      when: "Sun, 18:00 UTC",
      registered: 18420,
      participated: 14210,
      avgRating: 1642,
      solved: 3.4,
    },
    {
      name: "Div 2 · Educational",
      when: "Fri, 19:30 UTC",
      registered: 12210,
      participated: 9840,
      avgRating: 1420,
      solved: 4.1,
    },
    {
      name: "Global Round #12",
      when: "Sat, 20:00 UTC",
      registered: 24810,
      participated: 21044,
      avgRating: 1918,
      solved: 2.8,
    },
    {
      name: "Team Battle",
      when: "Mon, 18:00 UTC",
      registered: 4210,
      participated: 3820,
      avgRating: 1780,
      solved: 5.2,
    },
  ];
  return (
    <Section
      id="contests"
      title="Contest participation"
      desc="Attendance, difficulty fit, and completion."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Contests hosted" value="12" delta={20} hint="This month" />
        <Metric
          label="Avg. participation"
          value="12,228"
          delta={7.3}
          spark={spark(14, 100, 20, 2)}
        />
        <Metric label="Registration rate" value="78.4%" delta={2.6} />
        <Metric label="Completion rate" value="82.1%" delta={-1.4} />
      </div>

      <Card className="overflow-hidden">
        <div className="w-full overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-muted/40 text-2xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Contest</th>
              <th className="px-4 py-2 text-left font-medium">When</th>
              <th className="px-4 py-2 text-right font-medium">Registered</th>
              <th className="px-4 py-2 text-right font-medium">Participated</th>
              <th className="px-4 py-2 text-right font-medium">Avg. rating</th>
              <th className="px-4 py-2 text-right font-medium">Solved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.when}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {r.registered.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {r.participated.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{r.avgRating}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {r.solved.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </Section>
  );
}

/* =============================================================
 * CONTENT — cheat sheets
 * ============================================================= */

function ContentPanel() {
  const sheets = [
    {
      title: "Segment Tree — Iterative",
      author: "tourist",
      views: 128_420,
      stars: 8_412,
      delta: 12.4,
    },
    { title: "DP on Trees", author: "Errichto", views: 96_120, stars: 6_120, delta: 8.1 },
    {
      title: "Binary Search Answer Space",
      author: "SecondThread",
      views: 74_320,
      stars: 5_020,
      delta: 22.7,
    },
    { title: "DSU with Rollback", author: "Um_nik", views: 58_210, stars: 4_120, delta: -2.3 },
    { title: "Number Theory Primer", author: "jiangly", views: 42_180, stars: 3_240, delta: 4.6 },
  ];
  return (
    <Section id="content" title="Popular cheat sheets" desc="Top community resources this week.">
      <Card className="overflow-hidden">
        <div className="w-full overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-muted/40 text-2xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Title</th>
              <th className="px-4 py-2 text-left font-medium">Author</th>
              <th className="px-4 py-2 text-right font-medium">Views</th>
              <th className="px-4 py-2 text-right font-medium">Stars</th>
              <th className="px-4 py-2 text-right font-medium">Δ 7d</th>
            </tr>
          </thead>
          <tbody>
            {sheets.map((s) => (
              <tr key={s.title} className="border-t border-border/60 hover:bg-surface-muted/30">
                <td className="px-4 py-3 font-medium">{s.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.author}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {s.views.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {s.stars.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Delta v={s.delta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </Section>
  );
}

/* =============================================================
 * RECOMMENDATIONS
 * ============================================================= */

function RecommendationsPanel() {
  return (
    <Section
      id="recs"
      title="Recommendation engine"
      desc="Personalization performance vs. baseline."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Metric
          label="Served / day"
          value="184,210"
          delta={6.4}
          accent="primary"
          spark={spark(14, 100, 10, 2)}
        />
        <Metric
          label="Accept rate"
          value="41.8%"
          delta={3.2}
          hint="User clicked → attempted"
          accent="emerald"
        />
        <Metric label="Solve rate" value="27.4%" delta={1.9} hint="Attempted → solved" />
        <Metric
          label="Rating lift"
          value="+38 pts"
          delta={12}
          hint="30d cohort vs control"
          accent="violet"
        />
      </div>

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold">Top signals driving recommendations</p>
        <div className="space-y-2.5">
          {[
            { label: "Recent mistake clusters", weight: 34, color: "bg-primary" },
            { label: "Weak topic mastery", weight: 26, color: "bg-emerald-500" },
            { label: "Difficulty progression", weight: 18, color: "bg-violet-500" },
            { label: "Contest performance", weight: 14, color: "bg-amber-500" },
            { label: "Solving speed", weight: 8, color: "bg-rose-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-52 shrink-0 text-xs">{s.label}</span>
              <div className="flex-1 rounded-full bg-surface-muted">
                <div
                  className={cn("h-1.5 rounded-full", s.color)}
                  style={{ width: `${s.weight * 2.5}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono text-2xs text-muted-foreground">
                {s.weight}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
}

/* =============================================================
 * SEARCH
 * ============================================================= */

function SearchPanel() {
  const queries = [
    { q: "1700 rated graph problems", n: 4_210, ctr: 62, zero: 2 },
    { q: "segment tree tutorial", n: 3_820, ctr: 71, zero: 0 },
    { q: "tourist hardest dp", n: 2_140, ctr: 44, zero: 8 },
    { q: "dsu explanation", n: 1_920, ctr: 58, zero: 1 },
    { q: "problems like 1850E", n: 1_412, ctr: 48, zero: 4 },
    { q: "cp handbook pdf", n: 812, ctr: 12, zero: 41 },
  ];
  return (
    <Section
      id="search"
      title="Search analytics"
      desc="Query volume, click-through, and zero-result gaps."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Metric
          label="Queries / day"
          value="42,180"
          delta={9.1}
          accent="primary"
          spark={spark(14, 100, 12, 2)}
        />
        <Metric label="CTR" value="58.2%" delta={2.4} accent="emerald" />
        <Metric
          label="Zero results"
          value="3.1%"
          delta={-0.8}
          accent="amber"
          hint="lower is better"
        />
        <Metric label="AI answer rate" value="72.4%" delta={5.6} accent="violet" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <p className="text-sm font-semibold">Top queries</p>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Copy className="size-3.5" /> Export CSV
          </Button>
        </div>
        <div className="w-full overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-muted/40 text-2xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Query</th>
              <th className="px-4 py-2 text-right font-medium">Searches</th>
              <th className="px-4 py-2 text-right font-medium">CTR</th>
              <th className="px-4 py-2 text-right font-medium">Zero result</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((q) => (
              <tr key={q.q} className="border-t border-border/60">
                <td className="px-4 py-3 font-mono text-xs">{q.q}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {q.n.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{q.ctr}%</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "inline-block rounded-md px-1.5 py-0.5 font-mono text-2xs",
                      q.zero > 20
                        ? "bg-rose-500/10 text-rose-500"
                        : q.zero > 5
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600",
                    )}
                  >
                    {q.zero}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </Section>
  );
}

/* =============================================================
 * FEEDBACK
 * ============================================================= */

function FeedbackPanel() {
  const items = [
    {
      user: "priya_j",
      plan: "Pro",
      text: "Mistake analyzer nailed my DP transitions — recommend more edge-case drills.",
      tag: "praise",
      at: "2m",
    },
    {
      user: "arnav.k",
      plan: "Free",
      text: "Search returns nothing for 'meet in the middle'. Please index it.",
      tag: "bug",
      at: "18m",
    },
    {
      user: "leyla",
      plan: "Pro",
      text: "Would love collections shareable to Discord.",
      tag: "idea",
      at: "1h",
    },
    {
      user: "kenji",
      plan: "Team",
      text: "Team invoicing needs VAT for EU. Blocking finance.",
      tag: "billing",
      at: "3h",
    },
  ];
  const tagStyle: Record<string, string> = {
    praise: "bg-emerald-500/10 text-emerald-600",
    bug: "bg-rose-500/10 text-rose-500",
    idea: "bg-violet-500/10 text-violet-500",
    billing: "bg-amber-500/10 text-amber-600",
  };
  return (
    <Section id="feedback" title="Feedback inbox" desc="Triage user feedback by severity and plan.">
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All · 128</TabsTrigger>
            <TabsTrigger value="bugs">Bugs · 42</TabsTrigger>
            <TabsTrigger value="ideas">Ideas · 61</TabsTrigger>
            <TabsTrigger value="billing">Billing · 25</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Bell className="size-3.5" /> Notify Slack
          </Button>
        </div>
        <TabsContent value="all" className="mt-3">
          <Card>
            <ul className="divide-y divide-border/60">
              {items.map((f) => (
                <li key={f.user} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 grid size-7 place-items-center rounded-full bg-primary/10 font-mono text-2xs font-medium text-primary">
                    {f.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{f.user}</span>
                      <Badge
                        variant="secondary"
                        className="h-4 border-0 bg-surface-muted px-1.5 text-2xs"
                      >
                        {f.plan}
                      </Badge>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-2xs font-medium",
                          tagStyle[f.tag],
                        )}
                      >
                        {f.tag}
                      </span>
                      <span className="ml-auto text-2xs text-muted-foreground">{f.at} ago</span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground/90">{f.text}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-2xs">
                      <Check className="size-3" /> Resolve
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" aria-label="More actions">
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
        <TabsContent value="bugs" className="mt-3">
          <EmptyPlaceholder note="Showing bug reports only." />
        </TabsContent>
        <TabsContent value="ideas" className="mt-3">
          <EmptyPlaceholder note="Showing feature ideas only." />
        </TabsContent>
        <TabsContent value="billing" className="mt-3">
          <EmptyPlaceholder note="Showing billing feedback only." />
        </TabsContent>
      </Tabs>
    </Section>
  );
}

function EmptyPlaceholder({ note }: { note: string }) {
  return (
    <Card className="grid place-items-center px-6 py-10 text-center">
      <MessageSquare className="mb-2 size-5 text-muted-foreground" />
      <p className="text-sm font-medium">{note}</p>
      <p className="text-2xs text-muted-foreground">
        Filtered view — connect a datasource to populate.
      </p>
    </Card>
  );
}

/* =============================================================
 * MONITORING
 * ============================================================= */

function MonitoringPanel() {
  const services = [
    { name: "API · edge", status: "operational", p95: 84, err: 0.03 },
    { name: "Judge workers", status: "operational", p95: 212, err: 0.11 },
    { name: "Recommendations", status: "degraded", p95: 481, err: 0.42 },
    { name: "Search (vector)", status: "operational", p95: 128, err: 0.02 },
    { name: "Payments webhook", status: "operational", p95: 58, err: 0.0 },
  ];
  const statusColor: Record<string, string> = {
    operational: "bg-emerald-500",
    degraded: "bg-amber-500",
    outage: "bg-rose-500",
  };
  return (
    <Section id="monitoring" title="System monitoring" desc="Live health of core services.">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Uptime · 30d" value="99.983%" hint="1 incident · 4m 12s" accent="emerald" />
        <Metric label="Req/s (peak)" value="8,412" delta={4.2} spark={spark(14, 200, 40, 3)} />
        <Metric
          label="Error rate"
          value="0.12%"
          delta={-0.03}
          accent="amber"
          hint="Under 0.5% target"
        />
      </div>

      <Card>
        <div className="border-b border-border/60 px-4 py-2.5">
          <p className="text-sm font-semibold">Services</p>
        </div>
        <ul className="divide-y divide-border/60">
          {services.map((s) => (
            <li key={s.name} className="flex items-center gap-4 px-4 py-3">
              <span className={cn("size-2 rounded-full", statusColor[s.status])} />
              <span className="w-56 font-medium">{s.name}</span>
              <span className="text-2xs capitalize text-muted-foreground">{s.status}</span>
              <div className="ml-auto flex items-center gap-6 font-mono text-2xs text-muted-foreground">
                <span>p95 {s.p95}ms</span>
                <span>err {s.err}%</span>
                <Uptime />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
}

function Uptime() {
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: 40 }).map((_, i) => {
        const ok = !(i === 14 || i === 15);
        return (
          <span
            key={i}
            className={cn("h-3 w-1 rounded-[1px]", ok ? "bg-emerald-500/70" : "bg-amber-500")}
          />
        );
      })}
    </div>
  );
}

/* =============================================================
 * FEATURE FLAGS
 * ============================================================= */

function FlagsPanel() {
  const initial = [
    {
      key: "recs.v3-cold-start",
      desc: "Rank cold-start users via topic embeddings.",
      on: true,
      rollout: 100,
      env: "live",
    },
    {
      key: "search.perplexity-mode",
      desc: "AI-first search results with sources.",
      on: true,
      rollout: 82,
      env: "live",
    },
    {
      key: "mistakes.auto-drill",
      desc: "Auto-schedule drills after 3 failed submissions.",
      on: false,
      rollout: 0,
      env: "test",
    },
    {
      key: "community.collections-share",
      desc: "Share collections via public URL.",
      on: true,
      rollout: 45,
      env: "live",
    },
    {
      key: "contests.team-battle",
      desc: "Enable 3v3 team contests.",
      on: false,
      rollout: 10,
      env: "test",
    },
  ];
  const [flags, setFlags] = useState(initial);

  return (
    <Section
      id="flags"
      title="Feature flags"
      desc="Progressive rollouts, per environment."
      right={
        <Button size="sm" variant="ghost" className="gap-1.5">
          <Settings2 className="size-3.5" /> Flag settings
        </Button>
      }
    >
      <Card className="overflow-hidden">
        <ul className="divide-y divide-border/60">
          {flags.map((f, i) => (
            <li
              key={f.key}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-2xs">
                    {f.key}
                  </code>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-4 border-0 px-1.5 text-2xs",
                      f.env === "live"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600",
                    )}
                  >
                    {f.env}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{f.desc}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-40">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-muted-foreground">Rollout</span>
                    <span className="font-mono tabular-nums">{f.rollout}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={cn("h-full", f.on ? "bg-primary" : "bg-muted-foreground/40")}
                      style={{ width: `${f.rollout}%` }}
                    />
                  </div>
                </div>
              </div>

              <Switch
                checked={f.on}
                onCheckedChange={(v) =>
                  setFlags((prev) => prev.map((x, idx) => (idx === i ? { ...x, on: v } : x)))
                }
                aria-label={`Toggle ${f.key}`}
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex items-center gap-3 border-dashed p-4">
        <div className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Zap className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Ship a new flag</p>
          <p className="text-2xs text-muted-foreground">
            Wrap risky code in an off-by-default flag and roll out to 5% first.
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5">
          <LineIcon className="size-3.5" /> New flag
        </Button>
      </Card>
    </Section>
  );
}
