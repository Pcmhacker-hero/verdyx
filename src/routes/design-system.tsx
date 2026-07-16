import { createFileRoute, Link } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { supabase } from "@/integrations/supabase/client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  Circle,
  Command as CommandIcon,
  FileText,
  Filter,
  Inbox,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

import { Kbd } from "@/components/ds/kbd";
import { StatusDot } from "@/components/ds/status-dot";
import { EmptyState } from "@/components/ds/empty-state";
import { MetricCard } from "@/components/ds/metric-card";
import { SectionHeader } from "@/components/ds/section-header";
import { TokenSwatch } from "@/components/ds/token-swatch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/design-system")({
  component: DesignSystemPage,
});

/* ------------------------------------------------------------
 * Token metadata (single source of truth for the showcase)
 * ------------------------------------------------------------ */

const colorTokens = [
  { name: "background", var: "--background" },
  { name: "foreground", var: "--foreground" },
  { name: "surface", var: "--surface" },
  { name: "surface-muted", var: "--surface-muted" },
  { name: "surface-sunken", var: "--surface-sunken" },
  { name: "border", var: "--border" },
  { name: "border-strong", var: "--border-strong" },
  { name: "muted-foreground", var: "--muted-foreground" },
];

const signalTokens = [
  { name: "primary", var: "--primary" },
  { name: "accent", var: "--accent" },
  { name: "success", var: "--success" },
  { name: "warning", var: "--warning" },
  { name: "destructive", var: "--destructive" },
  { name: "info", var: "--info" },
];

const typeScale = [
  { name: "Display", cls: "text-5xl font-semibold tracking-tight", token: "--text-5xl · 48/52" },
  { name: "Heading 1", cls: "text-4xl font-semibold tracking-tight", token: "--text-4xl · 38/44" },
  { name: "Heading 2", cls: "text-3xl font-semibold tracking-tight", token: "--text-3xl · 30/38" },
  { name: "Heading 3", cls: "text-2xl font-semibold tracking-tight", token: "--text-2xl · 24/32" },
  { name: "Heading 4", cls: "text-xl font-semibold tracking-tight", token: "--text-xl · 20/28" },
  { name: "Body", cls: "text-base", token: "--text-base · 15/24" },
  { name: "Body / UI", cls: "text-sm", token: "--text-sm · 13/20" },
  { name: "Caption", cls: "text-xs text-muted-foreground", token: "--text-xs · 12/18" },
  {
    name: "Meta",
    cls: "font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground",
    token: "--text-2xs · 11/16",
  },
];

const spacingScale = [
  { name: "1", px: "4px", w: 4 },
  { name: "2", px: "8px", w: 8 },
  { name: "3", px: "12px", w: 12 },
  { name: "4", px: "16px", w: 16 },
  { name: "5", px: "20px", w: 20 },
  { name: "6", px: "24px", w: 24 },
  { name: "8", px: "32px", w: 32 },
  { name: "10", px: "40px", w: 40 },
  { name: "12", px: "48px", w: 48 },
  { name: "16", px: "64px", w: 64 },
];

const radiusScale = [
  { name: "xs", cls: "rounded-xs", token: "4px" },
  { name: "sm", cls: "rounded-sm", token: "6px" },
  { name: "md", cls: "rounded-md", token: "8px" },
  { name: "lg", cls: "rounded-lg", token: "10px" },
  { name: "xl", cls: "rounded-xl", token: "12px" },
  { name: "2xl", cls: "rounded-2xl", token: "16px" },
  { name: "full", cls: "rounded-full", token: "999px" },
];

const shadowScale = [
  { name: "xs", cls: "shadow-xs" },
  { name: "sm", cls: "shadow-sm" },
  { name: "md", cls: "shadow-md" },
  { name: "lg", cls: "shadow-lg" },
  { name: "xl", cls: "shadow-xl" },
];

const motionTokens = [
  { name: "instant", value: "80ms", token: "--duration-instant" },
  { name: "fast", value: "120ms", token: "--duration-fast" },
  { name: "base", value: "180ms", token: "--duration-base" },
  { name: "slow", value: "240ms", token: "--duration-slow" },
  { name: "slower", value: "400ms", token: "--duration-slower" },
];

const breakpoints = [
  { name: "sm", value: "640px", use: "Compact tablet" },
  { name: "md", value: "768px", use: "Tablet" },
  { name: "lg", value: "1024px", use: "Laptop" },
  { name: "xl", value: "1280px", use: "Desktop" },
  { name: "2xl", value: "1536px", use: "Wide desktop" },
];

/* ------------------------------------------------------------
 * Sample data
 * ------------------------------------------------------------ */

const chartData = [
  { d: "Mon", v: 420 },
  { d: "Tue", v: 512 },
  { d: "Wed", v: 468 },
  { d: "Thu", v: 590 },
  { d: "Fri", v: 720 },
  { d: "Sat", v: 640 },
  { d: "Sun", v: 810 },
];

const sparkData = [
  { v: 12 },
  { v: 18 },
  { v: 14 },
  { v: 22 },
  { v: 26 },
  { v: 21 },
  { v: 30 },
  { v: 34 },
];

const rows = [
  {
    id: "ATL-104",
    title: "Refactor billing webhook handler",
    owner: "MK",
    status: "In review",
    updated: "2h",
  },
  {
    id: "ATL-098",
    title: "Draft SOC 2 access-control policy",
    owner: "SA",
    status: "In progress",
    updated: "5h",
  },
  {
    id: "ATL-091",
    title: "Add tenant-scoped audit log to admin",
    owner: "JD",
    status: "Backlog",
    updated: "1d",
  },
  {
    id: "ATL-087",
    title: "Migrate scheduler to durable queue",
    owner: "RN",
    status: "Done",
    updated: "2d",
  },
];

/* ------------------------------------------------------------
 * Page
 * ------------------------------------------------------------ */

function DesignSystemPage() {
  const isAdmin = useIsAdmin();
  const [checked, setChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setChecked(true);
    });
  }, []);
  if (!checked) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }
  if (!signedIn || !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Admins only</h1>
          <p className="text-sm text-muted-foreground">
            The design system is restricted to workspace admins.
          </p>
          <Button asChild size="sm">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 sm:px-8">

        <Hero />
        <div className="mt-16 space-y-20">
          <Foundations />
          <Components />
        </div>
        <Footer />
      </main>
    </div>
  );
}

/* ---------- Top bar ---------- */

function TopBar() {
  const [cmdOpen, setCmdOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          <span className="hidden text-xs text-muted-foreground sm:inline">Design System v1.0</span>
          <Badge variant="secondary" className="ml-1 hidden font-mono text-2xs sm:inline-flex">
            stable
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden h-9 items-center gap-2 rounded-md border border-border bg-surface-muted/60 px-3 text-xs text-muted-foreground transition-colors hover:bg-surface-muted sm:inline-flex"
          >
            <Search className="size-3.5" />
            Search components…
            <span className="ml-6 flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <Button size="icon" variant="ghost" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              AK
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </header>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-7 place-items-center rounded-md bg-foreground text-background shadow-sm">
        <Layers className="size-3.5" strokeWidth={2.4} />
      </div>
      <span className="text-sm font-semibold tracking-tight">Verdiqx</span>
    </div>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-50" />
      <div className="relative grid gap-8 p-8 sm:p-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="max-w-2xl">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Foundations · Components · Patterns
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            A design system built for velocity and trust.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground text-pretty">
            Verdiqx is the shared language behind our product surfaces. Tokens for color, type, and
            motion; primitives you can compose without ever reaching for a hex value.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button>
              Browse components
              <ArrowUpRight className="size-4" />
            </Button>
            <Button variant="outline">
              <BookOpen className="size-4" />
              Read the guidelines
            </Button>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-6 border-t border-border pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          {[
            { k: "Tokens", v: "142" },
            { k: "Primitives", v: "38" },
            { k: "Patterns", v: "24" },
          ].map((s) => (
            <div key={s.k}>
              <dt className="text-xs text-muted-foreground">{s.k}</dt>
              <dd className="tabular mt-1 text-2xl font-semibold tracking-tight">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ---------- Foundations ---------- */

function Foundations() {
  return (
    <section id="foundations" className="space-y-14">
      <SectionHeader
        eyebrow="01 · Foundations"
        title="Tokens define everything"
        description="Color, typography, spacing, radius, elevation, and motion are all expressed as tokens. Components consume them — never the reverse."
      />

      {/* Color */}
      <SubSection title="Color" caption="Neutral ramp + one signal accent">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {colorTokens.map((t) => (
            <TokenSwatch
              key={t.name}
              name={t.name}
              value={t.var}
              swatchClassName="bg-[var(--swatch)]"
            >
              <div className="size-full" style={{ background: `var(${t.var})` }} />
            </TokenSwatch>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {signalTokens.map((t) => (
            <TokenSwatch key={t.name} name={t.name} value={t.var}>
              <div className="size-full" style={{ background: `var(${t.var})` }} />
            </TokenSwatch>
          ))}
        </div>
      </SubSection>

      {/* Typography */}
      <SubSection title="Typography" caption="Geist · optimized for UI density">
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {typeScale.map((t) => (
            <div
              key={t.name}
              className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-baseline gap-4 px-5 py-4"
            >
              <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
                {t.name}
              </span>
              <p className={cn("truncate text-foreground", t.cls)}>The quick brown fox</p>
              <span className="hidden font-mono text-2xs text-muted-foreground sm:inline">
                {t.token}
              </span>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Spacing */}
      <SubSection title="Spacing" caption="4pt base grid">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-2">
            {spacingScale.map((s) => (
              <div key={s.name} className="flex items-center gap-4">
                <span className="w-8 font-mono text-2xs text-muted-foreground">{s.name}</span>
                <div className="h-2 rounded-sm bg-primary/80" style={{ width: s.w * 2 }} />
                <span className="font-mono text-2xs text-muted-foreground">{s.px}</span>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      {/* Radius + Elevation grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <SubSection title="Radius" caption="Softness without decoration">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {radiusScale.map((r) => (
              <div
                key={r.name}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4"
              >
                <div
                  className={cn("size-14 border border-border-strong bg-surface-muted", r.cls)}
                />
                <span className="font-mono text-2xs text-muted-foreground">
                  {r.name} · {r.token}
                </span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Elevation" caption="Layered, low-contrast shadows">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {shadowScale.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-3 p-2">
                <div
                  className={cn(
                    "grid size-14 place-items-center rounded-lg border border-border bg-card",
                    s.cls,
                  )}
                >
                  <span className="font-mono text-2xs text-muted-foreground">{s.name}</span>
                </div>
              </div>
            ))}
          </div>
        </SubSection>
      </div>

      {/* Motion + Breakpoints */}
      <div className="grid gap-6 md:grid-cols-2">
        <SubSection title="Motion" caption="Ease-out-quart · purpose over polish">
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {motionTokens.map((m) => (
              <div key={m.name} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="font-mono text-2xs text-muted-foreground">{m.token}</p>
                </div>
                <span className="tabular text-sm text-muted-foreground">{m.value}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Breakpoints" caption="Mobile-first, 5 stops">
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {breakpoints.map((b) => (
              <div key={b.name} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-sm border border-border bg-surface-muted font-mono text-2xs">
                    {b.name}
                  </span>
                  <span className="text-sm">{b.use}</span>
                </div>
                <span className="tabular font-mono text-xs text-muted-foreground">{b.value}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </div>

      {/* Grid */}
      <SubSection title="Grid" caption="12-column, 24px gutters, 1280px max">
        <div className="overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-12 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 rounded-sm border border-border bg-primary/[0.06]" />
            ))}
          </div>
        </div>
      </SubSection>
    </section>
  );
}

function SubSection({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {caption ? <span className="text-xs text-muted-foreground">{caption}</span> : null}
      </div>
      {children}
    </div>
  );
}

/* ---------- Components ---------- */

function Components() {
  return (
    <section id="components" className="space-y-14">
      <SectionHeader
        eyebrow="02 · Components"
        title="Reusable primitives"
        description="Every primitive below is composed from tokens. Import, compose, ship. No hardcoded values, no bespoke variants."
      />

      <ButtonsBlock />
      <InputsBlock />
      <BadgesAndTooltipsBlock />
      <TabsAndDropdownsBlock />
      <CardsAndMetricsBlock />
      <TableBlock />
      <ChartsBlock />
      <DialogAndCommandBlock />
      <StatesBlock />
      <ToastsBlock />
    </section>
  );
}

function Block({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ButtonsBlock() {
  return (
    <Block title="Buttons" description="Six variants · four sizes · with icons, loading, disabled">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">
          <Trash2 />
          Delete
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm">
          <Plus />
          New issue
        </Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" variant="outline" aria-label="Settings">
          <Settings />
        </Button>
        <Button disabled>Disabled</Button>
      </div>
    </Block>
  );
}

function InputsBlock() {
  return (
    <Block title="Inputs & Search" description="Consistent height, focus ring, and affordances">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ds-email">Work email</Label>
          <Input id="ds-email" type="email" placeholder="you@company.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ds-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="ds-search" placeholder="Search issues, projects…" className="pl-8 pr-16" />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>/</Kbd>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="ds-switch" defaultChecked />
          <Label htmlFor="ds-switch" className="text-sm">
            Deploy previews
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="size-3.5" />
            Filter
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
          <Button variant="outline" size="sm">
            <User className="size-3.5" />
            Assignee
          </Button>
        </div>
      </div>
    </Block>
  );
}

function BadgesAndTooltipsBlock() {
  return (
    <Block title="Badges, Status & Tooltips" description="Semantic tone across the palette">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="outline">v1.4.0</Badge>
        <Badge variant="destructive">Blocked</Badge>
        <Badge variant="secondary" className="bg-success/10 text-success">
          <Check className="size-3" /> Passed
        </Badge>
        <Badge variant="secondary" className="bg-warning/15 text-warning-foreground">
          At risk
        </Badge>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-6">
        <StatusDot tone="success" label="Operational" pulse />
        <StatusDot tone="warning" label="Degraded" />
        <StatusDot tone="danger" label="Outage" />
        <StatusDot tone="neutral" label="Idle" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              Hover me
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tooltips explain — they never carry critical info.</TooltipContent>
        </Tooltip>
        <span className="text-xs text-muted-foreground">
          Try focusing with <Kbd>Tab</Kbd>
        </span>
      </div>
    </Block>
  );
}

function TabsAndDropdownsBlock() {
  return (
    <Block title="Tabs & Dropdowns" description="Navigation for section-level views">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Content aligns to the same 4pt rhythm as the tab bar itself.
          </p>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <p className="text-sm text-muted-foreground">Recent activity would render here.</p>
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <p className="text-sm text-muted-foreground">Team members table.</p>
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <p className="text-sm text-muted-foreground">Workspace settings.</p>
        </TabsContent>
      </Tabs>
      <div className="mt-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Options
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <FileText className="size-4" />
              Duplicate
              <CommandShortcut>⌘D</CommandShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <User className="size-4" />
              Reassign
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="size-4" />
              Delete…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Block>
  );
}

function CardsAndMetricsBlock() {
  return (
    <Block title="Cards & Metrics" description="Card as chrome; metric as content">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="MRR"
          value="$48,214"
          delta={{ value: "+12.4%", trend: "up" }}
          hint="vs. last 30 days"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="sparkA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--primary)"
                  strokeWidth={1.5}
                  fill="url(#sparkA)"
                />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard
          label="Active users"
          value="12,904"
          delta={{ value: "+3.1%", trend: "up" }}
          hint="7-day rolling"
        />
        <MetricCard
          label="Error rate"
          value="0.42%"
          delta={{ value: "-0.08pp", trend: "down" }}
          hint="Below SLA"
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace usage</CardTitle>
            <CardDescription>Resources consumed this cycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <UsageRow label="Seats" used={18} total={25} />
            <UsageRow label="Automations" used={620} total={1000} />
            <UsageRow label="Storage" used={42} total={100} unit="GB" />
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              Manage plan
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deploy previews</CardTitle>
            <CardDescription>Last 5 builds across production.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {[
                { sha: "a4f21c8", branch: "main", state: "success" },
                { sha: "9b21e0d", branch: "feat/perms", state: "success" },
                { sha: "3c8021f", branch: "fix/webhooks", state: "warning" },
                { sha: "2f01ab6", branch: "chore/deps", state: "success" },
              ].map((d) => (
                <li key={d.sha} className="flex items-center justify-between py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <StatusDot tone={d.state === "success" ? "success" : "warning"} size="sm" />
                    <span className="truncate text-sm">{d.branch}</span>
                  </div>
                  <span className="tabular font-mono text-xs text-muted-foreground">{d.sha}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Block>
  );
}

function UsageRow({
  label,
  used,
  total,
  unit,
}: {
  label: string;
  used: number;
  total: number;
  unit?: string;
}) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm">{label}</span>
        <span className="tabular font-mono text-2xs text-muted-foreground">
          {used}
          {unit ? ` ${unit}` : ""} / {total}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TableBlock() {
  return (
    <Block title="Tables" description="Dense, scannable, tabular numerals">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-24">Owner</TableHead>
            <TableHead className="w-24 text-right">Updated</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="tabular font-mono text-xs text-muted-foreground">
                {r.id}
              </TableCell>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>
                <StatusPill status={r.status} />
              </TableCell>
              <TableCell>
                <Avatar className="size-6">
                  <AvatarFallback className="text-2xs">{r.owner}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="tabular text-right text-xs text-muted-foreground">
                {r.updated} ago
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="size-7" aria-label="Row actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Block>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone: Record<string, { dot: "success" | "warning" | "info" | "neutral"; label: string }> = {
    Done: { dot: "success", label: "Done" },
    "In review": { dot: "info", label: "In review" },
    "In progress": { dot: "warning", label: "In progress" },
    Backlog: { dot: "neutral", label: "Backlog" },
  };
  const t = tone[status] ?? { dot: "neutral", label: status };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted/60 px-2 py-0.5 text-2xs font-medium text-foreground">
      <StatusDot tone={t.dot} size="sm" />
      {t.label}
    </span>
  );
}

function ChartsBlock() {
  const data = useMemo(() => chartData, []);
  return (
    <Block title="Charts" description="Recharts wired to design tokens">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="d"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <RTooltip
              cursor={{ stroke: "var(--border-strong)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--popover-foreground)",
                boxShadow: "var(--shadow-md)",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "var(--primary)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Block>
  );
}

function DialogAndCommandBlock() {
  const [cmdOpen, setCmdOpen] = useState(false);
  return (
    <Block title="Dialog & Command Palette" description="Modal focus, keyboard-first">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite teammates</DialogTitle>
              <DialogDescription>
                They'll get an email with a link to join this workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="ds-invite">Emails</Label>
              <Input id="ds-invite" placeholder="alex@company.com, jordan@company.com" />
            </div>
            <DialogFooter>
              <Button variant="ghost">Cancel</Button>
              <Button>Send invites</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => setCmdOpen(true)}>
          <CommandIcon className="size-4" />
          Command palette
          <span className="ml-2 flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </Button>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </Block>
  );
}

function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              <CommandItem>
                <Inbox className="size-4" /> Inbox
                <CommandShortcut>G I</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Layers className="size-4" /> Projects
                <CommandShortcut>G P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Settings className="size-4" /> Settings
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem>
                <Plus className="size-4" /> New issue
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Sparkles className="size-4" /> Ask Verdiqx
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function StatesBlock() {
  return (
    <Block title="Empty, Loading & Skeleton states" description="Never a blank screen">
      <div className="grid gap-4 md:grid-cols-2">
        <EmptyState
          icon={<Inbox className="size-4" />}
          title="No issues yet"
          description="Create your first issue to see it appear here. Everything you file is searchable in the command palette."
          action={
            <Button size="sm">
              <Plus className="size-3.5" />
              New issue
            </Button>
          }
        />
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Circle className="size-3 animate-pulse text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Loading
            </span>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Block>
  );
}

function ToastsBlock() {
  return (
    <Block title="Toasts" description="Confirm the action, never explain the app">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => toast("Changes saved")}>
          Default toast
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.success("Deployment queued", {
              description: "Build a4f21c8 · production",
            })
          }
        >
          Success
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.error("Couldn't reach billing service", {
              description: "We'll keep retrying in the background.",
              action: { label: "Retry", onClick: () => toast("Retrying…") },
            })
          }
        >
          Error with action
        </Button>
      </div>
    </Block>
  );
}

function Footer() {
  return (
    <footer className="mt-20 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <Logo />
        <span>· Design System</span>
      </div>
      <div className="flex items-center gap-4">
        <a className="hover:text-foreground" href="#foundations">
          Foundations
        </a>
        <a className="hover:text-foreground" href="#components">
          Components
        </a>
        <span className="font-mono text-2xs">v1.0.0</span>
      </div>
    </footer>
  );
}
