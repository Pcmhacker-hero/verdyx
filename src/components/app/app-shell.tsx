import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import logoAsset from "@/assets/logo.png.asset.json";
import { FloatingBugButton } from "@/components/app/floating-bug-button";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import {
  Bell,
  Gauge,
  Timer,
  BookOpen,
  Bug,
  Command as CommandIcon,
  Compass,
  Home,
  Inbox,
  Keyboard,
  Layers,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Network,
  Rocket,
  Loader2,
  LogOut,
  
  Search,
  Settings,
  Sparkles,
  Swords,
  Trophy,
  
  UserCircle2,
  Users,
  Video,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Kbd } from "@/components/ds/kbd";
import { CommandMenu } from "@/components/app/command-menu";
import { DemoBanner } from "@/components/app/demo-banner";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useCurrentUser } from "@/hooks/use-current-user";
import { submitBugReport } from "@/lib/bug-report.functions";
import { logBugReportEvent } from "@/lib/bug-report-events.functions";
import { z } from "zod";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";


interface NavItem {
  label: string;
  to: string;
  icon: typeof Home;
  shortcut?: string;
  key?: string; // single letter after "g"
  badge?: string;
  authRequired?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Practice",
    items: [
      
      { label: "Problems", to: "/problems", icon: Compass, shortcut: "G P", key: "p" },
      {
        label: "Custom Contest",
        to: "/simulator",
        icon: Timer,
        shortcut: "G V",
        key: "v",
        badge: "New",
      },
      { label: "Contests", to: "/contests", icon: Trophy, shortcut: "G O", key: "o" },
    ],
  },
  {
    label: "Analyze",
    items: [
      
      { label: "Cheat Library", to: "/cheatsheets", icon: BookOpen, shortcut: "G H", key: "h" },
      { label: "Video Solutions", to: "/videos", icon: Video, shortcut: "G I", key: "i" },
      { label: "Compare", to: "/compare", icon: Swords, shortcut: "G C", key: "c" },
    ],
  },
  {
    label: "You",
    items: [
      { label: "Ask Verdiqx", to: "/search", icon: Wand2, shortcut: "G A", key: "a", authRequired: true },
      { label: "Mentor", to: "/mentor", icon: Sparkles, shortcut: "G M", key: "m", badge: "2", authRequired: true },
      { label: "Community", to: "/community", icon: Users, shortcut: "G Y", key: "y" },
      
      { label: "Profile", to: "/profile", icon: UserCircle2, shortcut: "G U", key: "u" },
    ],
  },
];

const ADMIN_NAV: NavItem = { label: "Admin", to: "/admin", icon: Gauge, shortcut: "G D", key: "d" };
const DESIGN_SYSTEM_NAV: NavItem = { label: "Design System", to: "/design-system", icon: Layers };

const isDev = import.meta.env.DEV;
let sidebarCollapsedPreference = false;
const SIDEBAR_COLLAPSED_STORAGE_KEY = "verdiqx-sidebar-collapsed";

function rememberSidebarCollapsed(collapsed: boolean) {
  sidebarCollapsedPreference = collapsed;
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? "true" : "false");
}

function shouldAutoCloseSidebar(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-sidebar-keep-open='true']")) return false;
  return Boolean(target.closest("a[href], button"));
}

function buildSecondaryNav(isAdmin: boolean): NavItem[] {
  const items: NavItem[] = [];
  if (isAdmin) items.push(ADMIN_NAV);
  if (isAdmin || isDev) items.push(DESIGN_SYSTEM_NAV);
  return items;
}



interface AppShellProps {
  children: ReactNode;
  breadcrumb?: { label: string; to?: string }[];
  actions?: ReactNode;
}

export function AppShell({ children, breadcrumb, actions }: AppShellProps) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(sidebarCollapsedPreference);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isAdmin = useIsAdmin();
  const secondaryNav = useMemo(() => buildSecondaryNav(isAdmin), [isAdmin]);
  const allNavItems = useMemo<NavItem[]>(
    () => [...navSections.flatMap((s) => s.items), ...secondaryNav],
    [secondaryNav],
  );
  const gTimer = useRef<number | null>(null);
  const gArmed = useRef(false);
  const collapseSidebar = () => {
    rememberSidebarCollapsed(true);
    setSidebarCollapsed(true);
  };
  const expandSidebar = () => {
    rememberSidebarCollapsed(false);
    setSidebarCollapsed(false);
  };

  useEffect(() => {
    if (window.sessionStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true") {
      collapseSidebar();
    }
  }, []);

  // Close mobile drawer + auto-collapse desktop sidebar on route change (not first mount)
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      setMobileNavOpen(false);
      collapseSidebar();
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        return;
      }
      if (isTypingTarget(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        setCmdOpen(true);
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      // G-sequence
      if (gArmed.current) {
        const item = allNavItems.find((n) => n.key === e.key.toLowerCase());
        gArmed.current = false;
        if (gTimer.current) window.clearTimeout(gTimer.current);
        if (item) {
          e.preventDefault();
          navigate({ to: item.to });
          setMobileNavOpen(false);
          collapseSidebar();
        }
        return;
      }
      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gArmed.current = true;
        if (gTimer.current) window.clearTimeout(gTimer.current);
        gTimer.current = window.setTimeout(() => {
          gArmed.current = false;
        }, 1200);
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (gTimer.current) window.clearTimeout(gTimer.current);
    };
  }, [navigate]);

  return (
    <div
      className={cn(
        "grid min-h-dvh grid-cols-1 bg-background",
        sidebarCollapsed ? "md:grid-cols-1" : "md:grid-cols-[240px_minmax(0,1fr)]",
      )}
    >
      {/* Skip link — first tab stop */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-xs focus:font-medium focus:text-background"
      >
        Skip to main content
      </a>

      {!sidebarCollapsed ? (
        <DesktopSidebar
          onOpenCommand={() => setCmdOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onCollapse={collapseSidebar}
          pathname={pathname}
          secondaryNav={secondaryNav}
          isAdmin={isAdmin}
          onReportBug={() => setBugReportOpen(true)}
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <Header
          breadcrumb={breadcrumb}
          actions={actions}
          onOpenCommand={() => setCmdOpen(true)}
          onOpenInbox={() => navigate({ to: "/inbox" })}
          onOpenNotifications={() => navigate({ to: "/notifications" })}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onExpandSidebar={expandSidebar}
        />
        <DemoBanner />
        <main id="main-content" key={pathname} className="min-w-0 flex-1 overflow-x-hidden animate-page-enter">
          {children}
        </main>
      </div>

      {/* Mobile nav drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-72 border-r border-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <MobileNav
            pathname={pathname}
            secondaryNav={secondaryNav}
            isAdmin={isAdmin}
            onNavigate={() => setMobileNavOpen(false)}
            onReportBug={() => {
              setMobileNavOpen(false);
              setTimeout(() => setBugReportOpen(true), 60);
            }}
            onOpenCommand={() => {
              setMobileNavOpen(false);
              setTimeout(() => setCmdOpen(true), 60);
            }}
          />

        </SheetContent>
      </Sheet>

      <CommandMenu
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onOpenShortcuts={() => {
          setCmdOpen(false);
          setTimeout(() => setShortcutsOpen(true), 60);
        }}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <BugReportDialog open={bugReportOpen} onOpenChange={setBugReportOpen} />
      <FloatingBugButton hiddenOnDesktop={!sidebarCollapsed} />
    </div>
  );
}

function DesktopSidebar({
  onOpenCommand,
  onOpenShortcuts,
  onCollapse,
  pathname,
  secondaryNav,
  isAdmin,
  onReportBug,
}: {
  onOpenCommand: () => void;
  onOpenShortcuts: () => void;
  onCollapse: () => void;
  pathname: string;
  secondaryNav: NavItem[];
  isAdmin: boolean;
  onReportBug: () => void;
}) {
  const handleSidebarClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (shouldAutoCloseSidebar(event.target)) onCollapse();
  };

  const handleOpenCommand = () => {
    onOpenCommand();
    scheduleSidebarClose(onCollapse);
  };

  const handleReportBug = () => {
    onReportBug();
    scheduleSidebarClose(onCollapse);
  };

  return (
    <aside
      onClickCapture={handleSidebarClickCapture}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex"
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-2">
        <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
          Workspace
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Hide sidebar"
          onClick={onCollapse}
        >
          <PanelLeftClose className="size-3.5" />
        </Button>
      </div>
      <Brand onNavigate={onCollapse} />
      <SearchTrigger onClick={handleOpenCommand} />
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-2">
        {navSections.map((s, i) => (
          <div key={s.label}>
            {i > 0 ? <div className="my-2 h-px bg-border/60" /> : null}
            <NavGroup label={s.label} items={s.items} pathname={pathname} onNavigate={onCollapse} />
          </div>
        ))}
        {secondaryNav.length > 0 ? (
          <>
            <div className="my-2 h-px bg-border/60" />
            <NavGroup label="System" items={secondaryNav} pathname={pathname} onNavigate={onCollapse} />
          </>
        ) : null}
      </nav>

      <SidebarFooter
        onOpenShortcuts={onOpenShortcuts}
        isAdmin={isAdmin}
        onReportBug={handleReportBug}
        onNavigate={onCollapse}
      />
    </aside>
  );
}

function MobileNav({
  pathname,
  onOpenCommand,
  secondaryNav,
  isAdmin,
  onReportBug,
  onNavigate,
}: {
  pathname: string;
  onOpenCommand: () => void;
  secondaryNav: NavItem[];
  isAdmin: boolean;
  onReportBug: () => void;
  onNavigate?: () => void;
}) {
  const handleSidebarClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (shouldAutoCloseSidebar(event.target)) scheduleSidebarClose(onNavigate);
  };

  return (
    <div onClickCapture={handleSidebarClickCapture} className="flex h-full flex-col">
      <Brand onNavigate={onNavigate} />
      <SearchTrigger onClick={onOpenCommand} />
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-2">
        {navSections.map((s, i) => (
          <div key={s.label}>
            {i > 0 ? <div className="my-2 h-px bg-border/60" /> : null}
            <NavGroup label={s.label} items={s.items} pathname={pathname} onNavigate={onNavigate} />
          </div>
        ))}
        {secondaryNav.length > 0 ? (
          <>
            <div className="my-2 h-px bg-border/60" />
            <NavGroup label="System" items={secondaryNav} pathname={pathname} onNavigate={onNavigate} />
          </>
        ) : null}
      </nav>
      <SidebarFooter isAdmin={isAdmin} onReportBug={onReportBug} onNavigate={onNavigate} />
    </div>
  );
}



function scheduleSidebarClose(onNavigate?: () => void) {
  if (!onNavigate) return;
  window.setTimeout(onNavigate, 0);
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      to="/"
      aria-label="Go to home"
      onClick={() => scheduleSidebarClose(onNavigate)}
      className="flex h-14 items-center gap-2 px-4 rounded-md transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative size-7 overflow-hidden rounded-xl shadow-[0_6px_20px_-4px_rgba(56,132,255,0.55)]">
        <img src={logoAsset.url} alt="Verdiqx logo" className="size-full object-cover" />
        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold tracking-tight">Verdiqx</span>
        <span className="truncate text-2xs text-muted-foreground">alex's workspace</span>
      </div>
    </Link>

  );
}

function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <div className="px-3 pb-2">
      <button
        onClick={onClick}
        aria-label="Open command menu"
        className="flex h-8 w-full items-center gap-2 rounded-md border border-border/70 bg-surface-muted/60 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <Kbd>⌘K</Kbd>
      </button>
    </div>
  );
}

function SidebarFooter({
  onOpenShortcuts,
  isAdmin = false,
  onReportBug,
  onNavigate,
}: { onOpenShortcuts?: () => void; isAdmin?: boolean; onReportBug?: () => void; onNavigate?: () => void } = {}) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const name = user?.name ?? "Guest";
  const initials = user?.initials ?? "?";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      toast.success("Signed out");
      setConfirmOpen(false);
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      toast.error((err as Error).message ?? "Could not sign out");
      setSigningOut(false);
    }
  };

  const handleOpenShortcuts = () => {
    onOpenShortcuts?.();
    scheduleSidebarClose(onNavigate);
  };

  const handleReportBug = () => {
    onReportBug?.();
    scheduleSidebarClose(onNavigate);
  };

  return (
    <div className="border-t border-border p-3">
      <button
        type="button"
        onClick={handleReportBug}
        className="mb-2 flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bug className="size-4 opacity-80" />
        <span className="truncate">Report Bug</span>
      </button>
      {user ? (
        <>
          <button
            type="button"
            data-sidebar-keep-open="true"
            onClick={() => setConfirmOpen(true)}
            disabled={signingOut}
            aria-busy={signingOut}
            className="mb-2 flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          >
            {signingOut ? (
              <Loader2 className="size-4 animate-spin opacity-80" />
            ) : (
              <LogOut className="size-4 opacity-80" />
            )}
            <span className="truncate">{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
          <Dialog open={confirmOpen} onOpenChange={(o) => !signingOut && setConfirmOpen(o)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Sign out?</DialogTitle>
                <DialogDescription>
                  You'll need to sign back in to access your workspace.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmOpen(false)}
                  disabled={signingOut}
                >
                  <span aria-hidden="true" className="mr-1.5">🙅</span>
                  No
                </Button>
                <Button onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                      Signing out…
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true" className="mr-1.5">✅</span>
                      Yes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      <div className="flex items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-sidebar-accent">
        <Link
          to="/profile"
          aria-label="Open profile"
            onClick={() => scheduleSidebarClose(onNavigate)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-2xs font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-medium">{name}</p>
            {user?.email ? (
              <p className="truncate text-2xs text-muted-foreground">{user.email}</p>
            ) : null}
          </div>
        </Link>
        {onOpenShortcuts ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Keyboard shortcuts"
            onClick={handleOpenShortcuts}
          >
            <Keyboard className="size-3.5" />
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" className="size-7" aria-label="Settings" asChild>
          <Link to={isAdmin ? "/admin" : "/profile"} onClick={() => scheduleSidebarClose(onNavigate)}>
            <Settings className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function BugReportDialog({
  open,
  onOpenChange,
  source = "sidebar",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source?: "fab" | "sidebar";
}) {
  const reportBug = useServerFn(submitBugReport);
  const logEvent = useServerFn(logBugReportEvent);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "normal" | "high">("normal");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [touched, setTouched] = useState<{ title?: boolean; description?: boolean }>({});

  const bugReportSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .trim()
          .min(3, "Title must be at least 3 characters")
          .max(120, "Title must be 120 characters or fewer"),
        description: z
          .string()
          .trim()
          .min(10, "Please describe the issue in at least 10 characters")
          .max(2000, "Description must be 2000 characters or fewer"),
      }),
    [],
  );

  const validate = (values: { title: string; description: string }) => {
    const result = bugReportSchema.safeParse(values);
    if (result.success) return {} as { title?: string; description?: string };
    const fieldErrors: { title?: string; description?: string } = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as "title" | "description";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fieldErrors;
  };

  const pageUrl = () => (typeof window === "undefined" ? null : window.location.href);
  type LogEventPayload = {
    eventType: "opened" | "submitted" | "failed" | "cancelled";
    bugReportId?: string | null;
    pageUrl?: string | null;
    severity?: "low" | "normal" | "high" | null;
    errorMessage?: string | null;
    meta?: Record<string, unknown>;
  };
  const fireEvent = (payload: LogEventPayload) => {
    void logEvent({ data: payload }).catch(() => {});
  };

  function resetForm() {
    setTitle("");
    setDescription("");
    setSeverity("normal");
    setErrors({});
    setTouched({});
  }

  function handleOpenChange(next: boolean) {
    if (next && !open) {
      fireEvent({ eventType: "opened", pageUrl: pageUrl(), meta: { source } });
    } else if (!next && open && !submitting) {
      fireEvent({ eventType: "cancelled", pageUrl: pageUrl(), severity, meta: { source } });
      resetForm();
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const trimmed = { title: title.trim(), description: description.trim() };
    const fieldErrors = validate(trimmed);
    setTouched({ title: true, description: true });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      toast.error("Please fix the errors below before sending");
      return;
    }
    setSubmitting(true);
    try {
      const res = await reportBug({
        data: {
          title: trimmed.title,
          description: trimmed.description,
          severity,
          pageUrl: pageUrl() ?? undefined,
          browser:
            typeof window === "undefined"
              ? undefined
              : {
                  userAgent: window.navigator.userAgent,
                  viewport: `${window.innerWidth}x${window.innerHeight}`,
                },
        },
      });
      fireEvent({
        eventType: "submitted",
        pageUrl: pageUrl(),
        severity,
        bugReportId: res?.id ?? null,
        meta: { source },
      });
      if (res?.emailSent === false && res?.emailError) {
        toast.warning("Bug report saved, but email delivery failed", {
          description: res.emailError,
        });
      } else {
        toast.success("Bug report sent");
      }
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send bug report";
      fireEvent({
        eventType: "failed",
        pageUrl: pageUrl(),
        severity,
        errorMessage: message.slice(0, 500),
        meta: { source },
      });
      toast.error(message.includes("Unauthorized") ? "Sign in to report a bug" : message);
    } finally {
      setSubmitting(false);
    }
  }

  const showTitleError = touched.title && errors.title;
  const showDescError = touched.description && errors.description;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bug className="size-4 text-primary" /> Report Bug
          </DialogTitle>
          <DialogDescription>
            Send the issue with your current page and browser details attached.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            <span>
              Title <span aria-hidden className="text-destructive">*</span>
            </span>
            <input
              value={title}
              onChange={(event) => {
                const v = event.target.value;
                setTitle(v);
                if (touched.title) {
                  setErrors((prev) => ({
                    ...prev,
                    title: validate({ title: v, description }).title,
                  }));
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, title: true }));
                setErrors((prev) => ({
                  ...prev,
                  title: validate({ title, description }).title,
                }));
              }}
              maxLength={120}
              aria-invalid={showTitleError ? true : undefined}
              aria-describedby={showTitleError ? "bug-title-error" : undefined}
              className={cn(
                "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                showTitleError && "border-destructive focus-visible:ring-destructive",
              )}
              placeholder="What is broken?"
            />
            {showTitleError && (
              <span id="bug-title-error" className="text-xs font-normal text-destructive">
                {errors.title}
              </span>
            )}
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            <span className="flex items-center justify-between">
              <span>
                Details <span aria-hidden className="text-destructive">*</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {description.trim().length}/2000
              </span>
            </span>
            <textarea
              value={description}
              onChange={(event) => {
                const v = event.target.value;
                setDescription(v);
                if (touched.description) {
                  setErrors((prev) => ({
                    ...prev,
                    description: validate({ title, description: v }).description,
                  }));
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, description: true }));
                setErrors((prev) => ({
                  ...prev,
                  description: validate({ title, description }).description,
                }));
              }}
              maxLength={2000}
              rows={5}
              aria-invalid={showDescError ? true : undefined}
              aria-describedby={showDescError ? "bug-desc-error" : undefined}
              className={cn(
                "resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                showDescError && "border-destructive focus-visible:ring-destructive",
              )}
              placeholder="What did you click, what happened, and what did you expect?"
            />
            {showDescError && (
              <span id="bug-desc-error" className="text-xs font-normal text-destructive">
                {errors.description}
              </span>
            )}
          </label>
          <div className="grid gap-1.5 text-sm font-medium">
            Severity
            <div className="grid grid-cols-3 gap-2">
              {(["low", "normal", "high"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={cn(
                    "h-8 rounded-md border border-border text-xs font-medium capitalize transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    severity === level && "border-primary bg-primary/10 text-primary",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



function NavGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {

  return (
    <div className="space-y-0.5">
      <p className="px-2 pb-1.5 pt-1 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      {items.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        const comingSoon = item.label === "Community" || item.label === "Mistake Analyzer";
        const commonInner = (
          <>
            {active ? (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
              />
            ) : null}
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform group-hover:scale-110",
                active ? "text-primary" : "opacity-80",
                comingSoon && "opacity-50",
              )}
              strokeWidth={active ? 2.25 : 2}
            />
            <span className={cn("min-w-0 flex-1 truncate", comingSoon && "opacity-60")}>
              {item.label}
            </span>
            {comingSoon ? (
              <span className="coming-soon-badge" aria-label="Coming soon">
                <span className="coming-soon-badge__shine" aria-hidden />
                <span className="coming-soon-badge__text">Soon</span>
              </span>
            ) : item.badge ? (
              <Badge
                variant="secondary"
                className="h-4 border-0 bg-primary/10 px-1.5 font-mono text-2xs font-medium text-primary"
              >
                {item.badge}
              </Badge>
            ) : item.shortcut ? (
              <span className="hidden font-mono text-2xs text-muted-foreground/70 group-hover:inline">
                {item.shortcut}
              </span>
            ) : null}
          </>
        );
        if (comingSoon) {
          return (
            <div
              key={item.label}
              role="button"
              aria-disabled="true"
              title="Community — coming soon"
              className="group relative flex h-8 cursor-not-allowed items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground/80 transition-colors hover:bg-sidebar-accent/40"
            >
              {commonInner}
            </div>
          );
        }
        return (
          <Link
            key={item.label}
            to={item.to}
            aria-current={active ? "page" : undefined}
            onClick={() => scheduleSidebarClose(onNavigate)}
            className={cn(
              "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            {commonInner}
          </Link>

        );
      })}
    </div>
  );
}

function Header({
  breadcrumb,
  actions,
  onOpenCommand,
  onOpenInbox,
  onOpenNotifications,
  onOpenMobileNav,
  sidebarCollapsed,
  onExpandSidebar,
}: {
  breadcrumb?: { label: string; to?: string }[];
  actions?: ReactNode;
  onOpenCommand: () => void;
  onOpenInbox: () => void;
  onOpenNotifications: () => void;
  onOpenMobileNav: () => void;
  sidebarCollapsed: boolean;
  onExpandSidebar: () => void;
}) {
  const user = useCurrentUser();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-6">

      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 md:hidden"
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
      >
        <Menu className="size-4" />
      </Button>
      {sidebarCollapsed ? (
        <div className="hidden shrink-0 items-center overflow-hidden rounded-lg border border-border/70 bg-card md:inline-flex">
          <button
            type="button"
            aria-label="Show sidebar"
            onClick={onExpandSidebar}
            className="flex h-11 items-center justify-center px-4 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="size-6" strokeWidth={2.25} />
          </button>
          <span aria-hidden className="h-6 w-px bg-border/70" />
          <Link
            to="/"
            aria-label="Go to home"
            className="flex h-11 items-center gap-2.5 pl-4 pr-4 text-base font-semibold tracking-tight transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="relative size-7 overflow-hidden rounded-md shadow-[0_4px_14px_-4px_rgba(56,132,255,0.5)]">
              <img src={logoAsset.url} alt="Verdiqx logo" className="size-full object-cover" />
            </span>
            Verdiqx
          </Link>
        </div>
      ) : null}


      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        {(breadcrumb ?? [{ label: "Verdiqx" }]).map((c, i, arr) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {c.to ? (
              <Link
                to={c.to}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate",
                  i === arr.length - 1 ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {c.label}
              </span>
            )}
            {i < arr.length - 1 ? (
              <span aria-hidden className="text-muted-foreground/50">
                /
              </span>
            ) : null}
          </span>
        ))}
      </nav>

      <div className="flex min-w-0 shrink items-center gap-1.5">
        <button
          onClick={onOpenCommand}
          aria-label="Open command menu"
          className="hidden h-8 items-center gap-2 rounded-md border border-border bg-surface-muted/60 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
        >
          <Sparkles className="size-3.5 text-primary" />
          Ask Verdiqx or jump to…
          <span className="ml-4 flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Open command menu"
          className="size-8 lg:hidden"
          onClick={onOpenCommand}
        >
          <Search className="size-4" />
        </Button>
        {/* Page-level actions are duplicated in each route's body; hide from the
            cramped mobile header to prevent horizontal overflow. */}
        {actions ? <div className="hidden min-w-0 items-center gap-1.5 sm:flex">{actions}</div> : null}
        <ThemeToggle className="hidden sm:inline-flex" />
        <Button
          asChild
          size="icon"
          variant="ghost"
          aria-label="Inbox"
          className="hidden size-8 sm:inline-flex"
        >
          <Link to="/inbox" onClick={onOpenInbox}>
            <Inbox className="size-4" />
          </Link>
        </Button>

        <Button
          asChild
          size="icon"
          variant="ghost"
          aria-label="Notifications"
          className="hidden size-8 sm:inline-flex"
        >
          <Link to="/notifications" onClick={onOpenNotifications}>
            <Bell className="size-4" />
          </Link>
        </Button>
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-primary/10 text-2xs font-medium text-primary">
            {user?.initials ?? "?"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

// ---------------- keyboard shortcuts dialog ----------------

function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const groups = useMemo(
    () => [
      {
        label: "General",
        items: [
          { keys: ["⌘", "K"], label: "Open command menu" },
          { keys: ["/"], label: "Search or jump to…" },
          { keys: ["?"], label: "Show this dialog" },
          { keys: ["Esc"], label: "Close dialog / menu" },
        ],
      },
      ...navSections.map((s) => ({
        label: s.label,
        items: s.items.map((n) => ({
          keys: ["G", n.key?.toUpperCase() ?? ""],
          label: `Go to ${n.label}`,
        })),
      })),
    ],
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CommandIcon className="size-4 text-primary" /> Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
                {g.label}
              </p>
              <ul className="divide-y divide-border/70 overflow-hidden rounded-md border border-border/70">
                {g.items.map((it) => (
                  <li
                    key={it.label}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span>{it.label}</span>
                    <span className="flex items-center gap-1">
                      {it.keys.map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
