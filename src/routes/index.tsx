import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdiqx" },
      {
        name: "description",
        content: "A simple home page.",
      },
      { property: "og:title", content: "Verdiqx" },
      { property: "og:description", content: "A simple home page." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Welcome
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
        Get started by opening your dashboard or signing in.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/problems">Open Dashboard</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}

/* ============================================================
 * BACKGROUND — Aurora + grid
 * ============================================================ */

function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 15% 10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%), radial-gradient(50% 35% at 90% 5%, color-mix(in oklab, oklch(0.6 0.2 220) 18%, transparent), transparent 60%), radial-gradient(70% 50% at 50% 100%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 5%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 5%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at top, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at top, black 20%, transparent 75%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}

/* ============================================================
 * NAV
 * ============================================================ */

const NAV_LINKS: { href?: string; to?: string; label: string }[] = [
  { href: "#features", label: "Features" },
  { href: "#mentor", label: "AI Mentor" },
  { href: "#sheets", label: "Sheets" },
  { href: "#contests", label: "Contests" },
  { href: "#videos", label: "Video Solutions" },
  { href: "#calendar", label: "Contest Calendar" },
  { href: "#community", label: "Community" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:pt-4 md:pr-8"
    >
      <div
        className={cn(
          "group/nav relative flex h-16 w-full max-w-7xl items-center justify-between gap-3 overflow-hidden rounded-2xl border transition-all sm:gap-6",
          "border-white/15 bg-white/5 shadow-[0_8px_40px_-12px_rgba(79,70,229,0.35),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl backdrop-saturate-150",
          scrolled ? "bg-white/10" : "bg-white/[0.04]",
        )}
        style={{
          backgroundImage:
            "linear-gradient(135deg, color-mix(in oklab, white 10%, transparent) 0%, transparent 45%, color-mix(in oklab, var(--primary) 12%, transparent) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
        <div className="relative flex w-full items-center justify-between gap-2 px-3 sm:gap-6 sm:px-5">

        <Link to="/" className="group -ml-1 inline-flex min-w-0 items-center gap-2 pl-1 sm:-ml-2 sm:gap-2.5">
          <BrandMark />
          <span className="truncate font-display text-base font-semibold tracking-tight">Verdiqx</span>
          <span className="ml-1 hidden rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-primary sm:inline">
            beta
          </span>
        </Link>

        <nav className="hidden h-10 min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden whitespace-nowrap text-[13px] leading-none text-muted-foreground lg:flex">
          {NAV_LINKS.map((l) =>
            l.to ? (
              <Link
                key={l.to}
                to={l.to}
                className="relative inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 leading-none transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="relative inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 leading-none transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>


        <div className="flex shrink-0 items-center gap-1.5 pr-0.5 sm:gap-2 sm:pr-1">
          <Link
            to="/problems"
            className="hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Dashboard
          </Link>
          <div className="hidden sm:inline-flex">
            <ThemeToggle />
          </div>
          <NavAuthAction />
          <MobileNavMenu />
        </div>


        </div>
      </div>

    </motion.header>
  );
}

function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="size-9 shrink-0 rounded-full lg:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 border-l border-border bg-background p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between gap-2 border-b border-border/70 px-5">
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-display text-base font-semibold tracking-tight">Verdiqx</span>
            </div>
            <ThemeToggle className="mr-9" />
          </div>
          <nav className="flex-1 overflow-y-auto p-3">

            {NAV_LINKS.map((l) =>
              l.to ? (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  {l.label}
                </a>
              ),
            )}
            <div className="my-2 h-px bg-border/60" />
            <Link
              to="/problems"
              onClick={() => setOpen(false)}
              className="flex h-11 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BrandMark() {
  return (
    <div
      data-testid="brand-mark"
      className="relative size-8 overflow-hidden rounded-xl shadow-[0_6px_20px_-4px_rgba(56,132,255,0.55)]"
    >
      <img src={logoAsset.url} alt="Verdiqx logo" className="size-full object-cover" />
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
    </div>
  );
}


function NavAuthAction() {
  const [user, setUser] = useState<{ email?: string | null; avatar_url?: string | null } | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      setUser(
        u
          ? {
              email: u.email,
              avatar_url:
                (u.user_metadata?.avatar_url as string | undefined) ??
                (u.user_metadata?.picture as string | undefined) ??
                null,
            }
          : null,
      );
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(
        u
          ? {
              email: u.email,
              avatar_url:
                (u.user_metadata?.avatar_url as string | undefined) ??
                (u.user_metadata?.picture as string | undefined) ??
                null,
            }
          : null,
      );
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <div className="h-9 w-24 rounded-full bg-white/5" aria-hidden />;

  if (user) {
    const initial = (user.email ?? "?").charAt(0).toUpperCase();
    return (
      <Link
        to="/profile"
        aria-label="Open your profile"
        className="group inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-background/70 pl-1 pr-3 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-background"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="size-7 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
            {initial}
          </span>
        )}
        <span className="hidden sm:inline">Profile</span>
      </Link>
    );
  }

  return (
    <Button asChild size="sm" className="group h-9 gap-1.5 rounded-full px-4 text-xs shadow-lg shadow-primary/30">
      <Link to="/auth">
        Start free
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Button>
  );
}

/* ============================================================
 * HERO
 * ============================================================ */

function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] hidden justify-center px-3 pt-2 md:flex">
      <div className="flex h-9 max-w-6xl items-center gap-3 rounded-full border border-primary/25 bg-background/80 px-2 pr-4 text-xs backdrop-blur-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          New in 2026
        </span>
        <span className="text-foreground/80">
          <span className="font-semibold text-foreground">AI Mentor v2</span> is live — trained on 40k+ Codeforces solutions.
        </span>
        <Link to="/mentor" className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground transition hover:bg-primary/90">
          Try it <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
 * HERO
 * ============================================================ */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-28 pb-28 md:pt-32 md:pb-40 lg:pb-48">
      <motion.div style={{ y, opacity }} className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 sm:px-8 md:px-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 lg:px-16 xl:px-24">
        {/* LEFT — headline column */}
        <div className="relative pt-8 md:pt-24 lg:pt-28">
          <FadeUp>
            <h1 className="font-display text-[52px] font-bold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-[68px] md:text-[84px] lg:text-[92px]">
              <span className="block">Verdiqx</span>
              <span className="block">for CP</span>
              <span className="relative inline-block">
                <span className="bg-linear-to-r from-primary via-indigo-300 to-primary bg-clip-text text-transparent">
                  2026
                </span>
                <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-linear-to-r from-primary/80 to-indigo-400/80" />
              </span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.12}>
            <p className="mt-10 font-display text-[28px] font-bold tracking-tight text-primary md:text-[34px]">
              Train. Explain. Ship rating.
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="mt-6 max-w-[520px] text-[15px] leading-[1.7] text-muted-foreground md:text-base">
              From random grinding to AI-guided practice. India's largest
              AI-native workspace for competitive programmers — sheets from any
              legend, one-click explanations, and a mentor that remembers every
              contest you've ever played.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-14 rounded-full bg-foreground px-8 text-[15px] font-semibold text-background hover:bg-foreground/90">
                <Link to="/problems">Open Dashboard</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-foreground/25 bg-transparent px-8 text-[15px] font-semibold hover:bg-foreground/5">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </FadeUp>
        </div>


        {/* RIGHT — floating stat cards (zigzag: TR, ML, MR, BL) */}
        <div className="relative min-h-[36rem] lg:min-h-[40rem] lg:ml-12 lg:mt-20 xl:ml-20 xl:mt-28">
          <PlatformCard
            className="right-4 top-0 w-60"
            name="Codeforces"
            domain="codeforces.com"
            tagline="Rounds, ratings & editorials"
            accent="#1F8ACB"
            delay={0.2}
            float={{ y: 12, duration: 5.2 }}
          />
          <PlatformCard
            className="left-0 top-40 w-60"
            name="CodeChef"
            domain="codechef.com"
            tagline="Long & Cook-Off contests"
            accent="#5B4638"
            delay={0.35}
            float={{ y: 14, duration: 6.4 }}
          />
          <PlatformCard
            className="right-4 top-80 w-60"
            name="LeetCode"
            domain="leetcode.com"
            tagline="Interview prep & patterns"
            accent="#FFA116"
            delay={0.5}
            float={{ y: 10, duration: 5.8 }}
          />
          <PlatformCard
            className="bottom-0 left-0 w-60"
            name="AtCoder"
            domain="atcoder.jp"
            tagline="Beginner & Regular contests"
            accent="#222222"
            delay={0.65}
            float={{ y: 16, duration: 7.1 }}
          />



        </div>
      </motion.div>
    </section>
  );
}

function FloatCard({
  className,
  eyebrow,
  value,
  caption,
  pill,
  tone = "primary",
  delay = 0,
  float = { y: 12, duration: 6 },
}: {
  className?: string;
  eyebrow: string;
  value: string;
  caption: string;
  pill: string;
  tone?: "primary" | "info" | "muted";
  delay?: number;
  float?: { y: number; duration: number };
}) {
  const pillCls =
    tone === "info"
      ? "bg-sky-500/15 text-sky-300 border-sky-400/30"
      : tone === "muted"
        ? "bg-white/5 text-muted-foreground border-white/10"
        : "bg-primary/15 text-primary border-primary/30";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, -float.y, 0] }}
        transition={{ duration: float.duration, repeat: Infinity, ease: "easeInOut", delay }}
        whileHover={{ y: -6, rotate: 0.6, scale: 1.02 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl"
      >
        <div className="mb-3 h-0.5 w-8 rounded-full bg-primary/60" />
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
        <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{caption}</p>
        <span className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium", pillCls)}>
          <span className="size-1 rounded-full bg-current" />
          {pill}
        </span>
      </motion.div>
    </motion.div>
  );
}

function PlatformCard({
  className,
  name,
  domain,
  tagline,
  accent,
  delay = 0,
  float = { y: 12, duration: 6 },
}: {
  className?: string;
  name: string;
  domain: string;
  tagline: string;
  accent: string;
  delay?: number;
  float?: { y: number; duration: number };
}) {
  const logo = `https://icon.horse/icon/${domain}`;
  const fallbackLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, -float.y, 0] }}
        transition={{ duration: float.duration, repeat: Infinity, ease: "easeInOut", delay }}
        whileHover={{ y: -6, rotate: 0.6, scale: 1.03 }}
        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 shadow-2xl shadow-primary/10 backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <div
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/95 shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ boxShadow: `0 8px 24px -8px ${accent}66` }}
          >
            <img
              src={logo}
              alt={`${name} logo`}
              className="size-9 object-contain"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src !== fallbackLogo) img.src = fallbackLogo;
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-tight tracking-tight text-foreground">
              {name}
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {domain}
            </p>
          </div>
        </div>
        <p className="relative mt-4 text-xs leading-relaxed text-muted-foreground">
          {tagline}
        </p>
        <span
          className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium"
          style={{
            borderColor: `${accent}55`,
            color: accent,
            backgroundColor: `${accent}1A`,
          }}
        >
          <span className="size-1 rounded-full" style={{ backgroundColor: accent }} />
          Fully supported
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
 * SCENE 3D — scroll-linked premium tilt/parallax wrapper
 * ============================================================ */

function Scene3D({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // rAF-driven scroll progress.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Single smoothed source of truth — every derived value reads from `smooth`
  // so we run one spring per section, not five. Motion values update via rAF
  // on the compositor thread and never trigger React re-renders.
  const smooth = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    mass: 0.35,
    restDelta: 0.001,
  });

  // Compose transform in a single string so the browser can promote it to one
  // GPU layer instead of interpolating four separate style props each frame.
  // Filter/blur is intentionally dropped — it forces off-thread compositing
  // and is the biggest 60fps killer on scroll.
  const transform = useTransform(smooth, (p) => {
    if (reduced) return "none";
    // piecewise: enter (0→0.35), rest (0.35→0.65), exit (0.65→1)
    let rx: number, s: number, ty: number;
    if (p < 0.35) {
      const t = p / 0.35;
      rx = 14 - 14 * t;
      s = 0.93 + 0.07 * t;
      ty = 60 - 60 * t;
    } else if (p < 0.65) {
      rx = 0;
      s = 1;
      ty = 0;
    } else {
      const t = (p - 0.65) / 0.35;
      rx = -10 * t;
      s = 1 - 0.04 * t;
      ty = -40 * t;
    }
    return `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(3)}) rotateX(${rx.toFixed(2)}deg)`;
  });

  const opacity = useTransform(
    smooth,
    [0, 0.25, 0.75, 1],
    reduced ? [1, 1, 1, 1] : [0.4, 1, 1, 0.6],
  );

  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={{
        perspective: 1400,
        perspectiveOrigin: "50% 40%",
        // isolate paints so a re-render elsewhere doesn't invalidate this subtree
        contain: "layout paint",
      }}
    >
      <motion.div
        style={{
          transform,
          opacity,
          transformOrigin: "50% 50%",
          willChange: reduced ? "auto" : "transform, opacity",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </motion.div>
    </section>
  );
}





function MentorChatMock() {
  const messages = [
    { role: "user" as const, text: "Analyze my last 5 contests and tell me what to fix." },
    {
      role: "ai" as const,
      text: "You lost 82 points on two problems tagged `dp` + `trees`. I built a 12-problem focus sheet at rating 1500-1700. Want me to schedule 3 sessions this week?",
    },
    { role: "user" as const, text: "Yes, and add a mock contest on Sunday." },
  ];
  return (
    <div className="space-y-3">
      {messages.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.15, duration: 0.4 }}
          className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
        >
          {m.role === "ai" && (
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/30">
              <Bot className="size-3.5" />
            </div>
          )}
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
              m.role === "user"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border border-white/10 bg-white/5 text-foreground",
            )}
          >
            {m.text}
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-background/60 px-3 py-2 text-sm text-muted-foreground"
      >
        <Send className="size-3.5" />
        Ask Verdiqx anything about your CP journey…
      </motion.div>
    </div>
  );
}

function MiniStatCard({
  title,
  value,
  delta,
  tone = "primary",
}: {
  title: string;
  value: string;
  delta: string;
  tone?: "primary" | "warning" | "info";
}) {
  const toneCls =
    tone === "warning"
      ? "text-amber-400"
      : tone === "info"
        ? "text-sky-400"
        : "text-primary";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
        <span className={cn("text-xs font-medium", toneCls)}>{delta}</span>
      </div>
    </div>
  );
}

/* ============================================================
 * TRUSTED
 * ============================================================ */

function TrustedStrip() {
  const logos = ["Codeforces", "LeetCode", "CodeChef", "AtCoder", "HackerRank", "USACO", "TopCoder", "Kaggle"];
  return (
    <section className="py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Trusted by CP students from ICPC, IOI, and top universities
        </p>
        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
            className="flex w-max gap-14"
          >
            {[...logos, ...logos].map((l, i) => (
              <span key={i} className="font-display text-xl font-medium tracking-tight text-muted-foreground/60">
                {l}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * FEATURES
 * ============================================================ */

const CORE_FEATURES = [
  {
    icon: FileText,
    title: "AI-generated Custom Sheets",
    body: "Turn any Codeforces handle, rating range, or tag list into a curated practice sheet in seconds.",
  },
  {
    icon: Lightbulb,
    title: "One-click AI Explain",
    body: "Paste any problem URL and get intuition, patterns, dry runs, and multi-language code instantly.",
  },
  {
    icon: Bot,
    title: "AI Mentor on your history",
    body: "A coach trained on your Codeforces submissions — knows your weak topics, mistakes, and rating goals.",
  },
  {
    icon: Swords,
    title: "Custom Contest Generator",
    body: "Build a 3-problem round from any rating band, tags, or unsolved backlog. Timer, penalty, and scoreboard included.",
  },
  {
    icon: Radar,
    title: "Profile Comparison",
    body: "Benchmark yourself against friends or legends — topic coverage, difficulty, gaps, and AI catch-up plan.",
  },
  {
    icon: Calendar,
    title: "Smart Contest Tracker",
    body: "Every upcoming Codeforces / AtCoder / CodeChef round in one calendar, with prep tasks and reminders.",
  },
  {
    icon: Map,
    title: "Personalized Roadmaps",
    body: "AI-generated weekly and monthly plans that adapt as your rating and topic mastery change.",
  },
  {
    icon: Wand2,
    title: "AI Practice Recommendations",
    body: "Every morning, three problems picked for you — not random, not viral, tuned to your weak points.",
  },
];

function SectionFeatures() {
  return (
    <Scene3D id="features" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHead
          eyebrow="Core Features"
          title="Everything a competitive programmer needs, powered by AI."
          subtitle="Not another CP tracker. Verdiqx is the operating system between you and your rating goal."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-primary/40 hover:bg-white/[0.05]"
            >
              <div className="mb-4 grid size-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              <div className="pointer-events-none absolute -bottom-16 -right-16 size-40 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </Scene3D>
  );
}

/* ============================================================
 * AI MENTOR DEMO
 * ============================================================ */

function SectionMentorDemo() {
  return (
    <Scene3D id="mentor" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <EyebrowBadge icon={Bot}>AI Mentor</EyebrowBadge>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              A coach that <span className="text-primary">actually knows you.</span>
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Verdiqx Mentor reads your last 500 submissions, spots the patterns you keep missing,
              and turns them into a plan — weekly roadmap, daily tasks, and rating predictions that
              update after every contest.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Recent contests & rating trajectory",
                "Weak topics ranked by impact on rating",
                "Common mistake patterns from your history",
                "Weekly plan, daily tasks, target rating tracking",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-foreground/90">
                  <Check className="mt-0.5 size-4 text-primary" /> {line}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button asChild size="lg" className="h-11 rounded-full px-5 shadow-lg shadow-primary/25">
                <Link to="/mentor">
                  Chat with your Mentor
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <GlassCard>
            <div className="border-b border-white/5 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Bot className="size-3.5 text-primary" /> Mentor · reading your Codeforces history
              </span>
            </div>
            <div className="space-y-3 p-4">
              <ChatLine role="ai" text="You dropped 82 points on `dp` problems in your last 5 contests." />
              <ChatLine role="ai" text="Root cause: you try greedy first on state-transition problems. I built a 12-problem sheet at rating 1500-1700 focused on DP intuition." />
              <ChatLine role="user" text="Also — I want to hit 1800 by December." />
              <ChatLine role="ai" text="Realistic. Requires ~4 focused sessions/week + 2 rated rounds. I'll block them on your calendar and remind you." />
              <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Weekly plan · generated
                </div>
                <div className="grid gap-1.5">
                  {[
                    ["Mon", "DP intuition · 3 problems"],
                    ["Wed", "Contest prep · CF Round 987"],
                    ["Fri", "Weak-topic review · trees"],
                    ["Sun", "Mock contest · custom 3-problem"],
                  ].map(([d, t]) => (
                    <div key={d} className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">{d}</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Scene3D>
  );
}

function ChatLine({ role, text }: { role: "user" | "ai"; text: string }) {
  return (
    <div className={cn("flex gap-2", role === "user" ? "justify-end" : "justify-start")}>
      {role === "ai" && (
        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/30">
          <Bot className="size-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
          role === "user"
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : "border border-white/10 bg-white/5 text-foreground",
        )}
      >
        {text}
      </div>
    </div>
  );
}

/* ============================================================
 * SHEET GENERATOR
 * ============================================================ */

function SectionSheetGenerator() {
  return (
    <Scene3D id="sheets" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <GlassCard>
            <div className="border-b border-white/5 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" /> Custom Sheet Generator
              </span>
            </div>
            <div className="space-y-3 p-4">
              <SheetField label="Source" value="Codeforces handle: tourist" icon={Users} />
              <SheetField label="Rating band" value="1600 – 2000" icon={Trophy} />
              <SheetField label="Tags" value="dp · graphs · greedy" icon={Sparkles} />
              <SheetField label="Filter" value="Unsolved by you · 20 problems" icon={ListChecks} />
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                    Generated sheet · 20 problems
                  </span>
                  <span className="text-[10px] text-muted-foreground">2.4s</span>
                </div>
                <div className="grid gap-1 text-xs">
                  {[
                    ["1832E", "Combinatorics rework", 1900],
                    ["1856D", "Tree DP with rerooting", 1800],
                    ["1795F", "Segment tree + lazy", 2000],
                    ["1841D", "Two-pointer greedy", 1700],
                  ].map(([id, name, rating]) => (
                    <div key={id as string} className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
                      <span className="font-mono text-[11px] text-primary">{id}</span>
                      <span className="truncate text-muted-foreground">{name}</span>
                      <span className="font-mono text-[11px] text-foreground/80">{rating as number}</span>
                    </div>
                  ))}
                  <div className="pt-1 text-center text-[10px] text-muted-foreground">+ 16 more</div>
                </div>
              </div>
            </div>
          </GlassCard>

          <div>
            <EyebrowBadge icon={FileText}>Custom Sheets</EyebrowBadge>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Turn any profile into a{" "}
              <span className="text-primary">practice sheet.</span>
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Generate from any Codeforces legend, from multiple handles, by rating, tag, contest,
              difficulty, or solved/unsolved status. Save, share, clone, export — Notion meets
              Codeforces.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
              {[
                "From any handle",
                "From multiple users",
                "By rating band",
                "By tags",
                "By contest",
                "Solved / unsolved",
                "Save · Share · Clone",
                "Export to Notion",
              ].map((c) => (
                <div key={c} className="flex items-center gap-1.5 text-foreground/90">
                  <ChevronRight className="size-3.5 text-primary" /> {c}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild size="lg" className="h-11 rounded-full px-5 shadow-lg shadow-primary/25">
                <Link to="/problems">
                  Generate a sheet
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Scene3D>
  );
}

function SheetField({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

/* ============================================================
 * AI EXPLAIN
 * ============================================================ */

function SectionAiExplain() {
  return (
    <Scene3D id="ai-explain" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHead
          eyebrow="AI Explain"
          title="Paste any problem. Understand it in 10 seconds."
          subtitle="Intuition, patterns, dry runs, optimal solution, common mistakes, and multi-language code — instantly."
        />
        <GlassCard className="mt-14">
          <div className="grid gap-0 md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] md:divide-x md:divide-white/10">
            <div className="space-y-4 p-6">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-background/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Problem URL
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 px-3 py-2.5 font-mono text-xs text-foreground/80">
                codeforces.com/contest/1832/problem/E
              </div>
              <Button size="sm" className="w-full gap-1.5 rounded-full">
                <Wand2 className="size-3.5" /> Explain with AI
              </Button>
              <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {[
                  "Problem intuition",
                  "Observation & pattern",
                  "Multiple approaches",
                  "Optimal solution + dry run",
                  "Complexity analysis",
                  "Common mistakes",
                  "Code · C++ · Python · Java",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="size-3 text-primary" /> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3 p-6">
              <div>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-primary">Intuition</div>
                <p className="text-sm text-foreground/90">
                  Because the operations reverse subarrays, the achievable set is exactly the
                  permutations reachable by a sequence of reversals of length ≥ 2. This gives you
                  the equivalent transposition structure — parity of the permutation.
                </p>
              </div>
              <div>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-primary">Pattern</div>
                <p className="text-sm text-foreground/90">
                  Reduce to <span className="font-mono text-primary">parity of permutations</span>{" "}
                  · classic Codeforces DP trick.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-foreground/80">
                <span className="text-primary">def</span> solve(n, a):
                <br />
                &nbsp;&nbsp;<span className="text-primary">return</span> parity(a) == parity(sorted(a))
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Time: O(n log n)</span>
                <span>Space: O(1)</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </Scene3D>
  );
}

/* ============================================================
 * VIDEO SOLUTIONS
 * ============================================================ */

function SectionVideoSolutions() {
  const videos = [
    { pid: "1918D", title: "Codeforces Round 918 · D — Tree DP Walkthrough", channel: "Errichto", duration: "14:32", views: "182K views" },
    { pid: "1856D", title: "1856D Editorial — Rerooting, Explained Simply", channel: "SecondThread", duration: "9:47", views: "94K views" },
    { pid: "1946F", title: "Segment Tree + Lazy Propagation · Live Solve", channel: "Colin Galen", duration: "22:15", views: "310K views" },
  ];
  return (
    <Scene3D id="videos" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div>
            <EyebrowBadge icon={Youtube}>Video Solutions</EyebrowBadge>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Stuck on a Codeforces problem?{" "}
              <span className="text-primary">Watch it solved.</span>
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Drop any Codeforces problem ID like{" "}
              <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-sm text-primary">1832E</code>{" "}
              and instantly get the best YouTube walkthroughs — editorials, live solves, and
              creator explainers — played inside the app. No redirects, no blockers.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
              {[
                "Codeforces ID search",
                "In-app video player",
                "Editorials prioritized",
                "Thumbnails + durations",
                "Cached for 30 days",
                "One-tap refresh",
              ].map((c) => (
                <div key={c} className="flex items-center gap-1.5 text-foreground/90">
                  <ChevronRight className="size-3.5 text-primary" /> {c}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild size="lg" className="h-11 rounded-full px-5 shadow-lg shadow-primary/25">
                <Link to="/videos">
                  Try Video Search
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <GlassCard>
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-tight">
                  <span className="text-[#1F8ACB]">C</span>
                  <span className="text-white">F</span>
                </span>
                <span>→</span>
                <Youtube className="size-3.5 text-red-500" /> Video Solutions
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-primary">
                Cached · 0ms
              </span>
            </div>
            <div className="space-y-2 p-4">
              {videos.map((v) => (
                <div
                  key={v.title}
                  className="group flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="relative grid aspect-video w-32 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-red-500/30 via-primary/20 to-transparent">
                    <div className="grid size-9 place-items-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20 transition group-hover:scale-110 group-hover:bg-red-500/90">
                      <PlayCircle className="size-5 text-white" />
                    </div>
                    <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 font-mono text-[9px] font-bold text-white">
                      <span className="text-[#4DA9E0]">CF</span>
                      <span className="ml-0.5 text-white/80">{v.pid}</span>
                    </span>
                    <CFSolutionBadge />
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-medium text-white shadow-sm">
                      {v.duration}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">
                      {v.title}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-muted-foreground">
                      <Youtube className="size-3 shrink-0 text-red-500/80" />
                      {v.channel}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{v.views}</div>
                  </div>
                </div>
              ))}
              <div className="pt-1 text-center text-[10px] text-muted-foreground">
                + refresh anytime for fresh picks
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Scene3D>
  );
}

/* ============================================================
 * CONTESTS (Tracker + Generator merged)
 * ============================================================ */


function SectionContests() {
  return (
    <Scene3D id="contests" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHead
          eyebrow="Contests"
          title="Track every round. Or generate your own."
          subtitle="Codeforces, AtCoder, CodeChef — one calendar. Plus a custom contest generator when you want to train exactly what you need."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <div className="border-b border-white/5 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" /> Smart Contest Tracker
              </span>
            </div>
            <div className="space-y-2 p-4">
              {[
                { d: "Sat, 14:35", n: "Codeforces Round 987 (Div. 2)", tag: "Rated 1200-2099", live: true },
                { d: "Sun, 12:00", n: "AtCoder Beginner Contest 372", tag: "Rated 0-1999" },
                { d: "Wed, 20:00", n: "CodeChef Starters 154", tag: "Rated all" },
                { d: "Fri, 22:00", n: "Codeforces Educational 178", tag: "Rated ≤2099" },
              ].map((c) => (
                <div key={c.n} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{c.n}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.d} · {c.tag}
                    </div>
                  </div>
                  {c.live ? (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/40">
                      Prep queued
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">
                      Remind me
                    </span>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="border-b border-white/5 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Swords className="size-3.5 text-primary" /> Custom Contest Generator
              </span>
            </div>
            <div className="space-y-3 p-4">
              <SheetField label="Rating band" value="1600 – 1800" icon={Trophy} />
              <SheetField label="Problems" value="3" icon={ListChecks} />
              <SheetField label="Duration" value="90 min · penalty on" icon={Zap} />
              <SheetField label="Focus" value="dp · graphs" icon={Sparkles} />
              <Button size="sm" className="w-full gap-1.5 rounded-full">
                <Wand2 className="size-3.5" /> Generate contest
              </Button>
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Live scoreboard
                </div>
                <div className="grid gap-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>you</span>
                    <span className="text-primary">1420 pts · rank 1</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>ai-benchmark</span>
                    <span>1180 pts · rank 2</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Scene3D>
  );
}

/* ============================================================
 * CONTEST CALENDAR — animated month grid preview
 * ============================================================ */

const CAL_EVENTS: Record<number, { platform: string; name: string; time: string; tone: "primary" | "info" | "warn" }> = {
  4:  { platform: "CF",  name: "Round 987 (Div. 2)",     time: "14:35", tone: "primary" },
  7:  { platform: "AC",  name: "ABC 372",                time: "12:00", tone: "info" },
  10: { platform: "CC",  name: "Starters 154",           time: "20:00", tone: "warn" },
  13: { platform: "CF",  name: "Educational 178",        time: "22:00", tone: "primary" },
  17: { platform: "CF",  name: "Round 988 (Div. 1+2)",   time: "17:05", tone: "primary" },
  21: { platform: "AC",  name: "ARC 189",                time: "17:00", tone: "info" },
  24: { platform: "CF",  name: "Global Round 29",        time: "17:35", tone: "primary" },
  28: { platform: "LC",  name: "Weekly Contest 428",     time: "08:00", tone: "warn" },
};

function SectionContestCalendar() {
  const [hovered, setHovered] = useState<number | null>(17);
  const days = Array.from({ length: 35 }, (_, i) => i - 2); // grid starts a bit before month
  const active = hovered != null ? CAL_EVENTS[hovered] : null;

  return (
    <Scene3D id="calendar" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHead
          eyebrow="Contest Calendar"
          title="Every round, one glance ahead."
          subtitle="A living month view of Codeforces, AtCoder, CodeChef & LeetCode. Hover a day to see the round — Verdiqx queues prep tasks automatically."
        />

        <GlassCard className="mt-14 overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {/* LEFT — calendar grid */}
            <div className="relative border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    November · 2026
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold tracking-tight">
                    8 upcoming rounds
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <LegendDot tone="primary" label="CF" />
                  <LegendDot tone="info" label="AC" />
                  <LegendDot tone="warn" label="CC / LC" />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-[11px] text-muted-foreground">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="pb-1 text-center font-mono uppercase tracking-widest">
                    {d}
                  </div>
                ))}
                {days.map((n, i) => {
                  const inMonth = n >= 1 && n <= 30;
                  const event = inMonth ? CAL_EVENTS[n] : undefined;
                  const isHover = hovered === n;
                  return (
                    <motion.button
                      key={i}
                      onMouseEnter={() => event && setHovered(n)}
                      onFocus={() => event && setHovered(n)}
                      whileHover={event ? { y: -2 } : undefined}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "relative aspect-square rounded-lg border text-left transition-colors",
                        inMonth
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-transparent bg-transparent text-muted-foreground/30",
                        event && "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.08]",
                        isHover && event && "border-primary/60 bg-primary/[0.12] shadow-[0_0_0_1px_rgba(79,70,229,0.35)]",
                      )}
                    >
                      <span className="absolute left-1.5 top-1 font-mono text-[10px] text-muted-foreground">
                        {inMonth ? n : ""}
                      </span>
                      {event && (
                        <>
                          <span
                            className={cn(
                              "absolute bottom-1.5 left-1.5 rounded-sm px-1 py-[1px] font-mono text-[8px] font-semibold tracking-wider",
                              event.tone === "primary" && "bg-primary/25 text-primary",
                              event.tone === "info" && "bg-sky-500/25 text-sky-300",
                              event.tone === "warn" && "bg-amber-500/25 text-amber-300",
                            )}
                          >
                            {event.platform}
                          </span>
                          <motion.span
                            aria-hidden
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            className={cn(
                              "absolute right-1.5 top-1.5 size-1.5 rounded-full",
                              event.tone === "primary" && "bg-primary",
                              event.tone === "info" && "bg-sky-400",
                              event.tone === "warn" && "bg-amber-400",
                            )}
                          />
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — detail panel */}
            <div className="relative flex flex-col p-6">
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                <Calendar className="size-3" /> Focused round
              </div>

              <motion.div
                key={hovered ?? "none"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5"
              >
                <div className="font-display text-lg font-semibold tracking-tight">
                  {active?.name ?? "Hover a day to preview"}
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {active ? `Nov ${hovered} · starts ${active.time} IST` : "Live rounds appear here"}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { k: "Rating band", v: "1200–2099" },
                    { k: "Duration", v: "2h 15m" },
                    { k: "Problems", v: "6" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.k}</div>
                      <div className="mt-0.5 font-mono text-xs text-foreground">{s.v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                    <Sparkles className="size-3" /> Prep queued
                  </div>
                  {[
                    "3 warm-up problems on constructive · 1500",
                    "Editorial recap: Round 985 D",
                    "Timer + mock room 20 min before start",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2 text-xs text-foreground/85">
                      <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <Button asChild size="sm" className="mt-5 w-full gap-1.5 rounded-full">
                <Link to="/contests">
                  Open full calendar <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </Scene3D>
  );
}

function LegendDot({ tone, label }: { tone: "primary" | "info" | "warn"; label: string }) {
  const cls =
    tone === "primary" ? "bg-primary" : tone === "info" ? "bg-sky-400" : "bg-amber-400";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", cls)} />
      {label}
    </span>
  );
}


/* ============================================================
 * COMPARE
 * ============================================================ */

function SectionCompare() {
  return (
    <Scene3D id="compare" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHead
          eyebrow="Profile Compare"
          title="Compare yourself against the world's best."
          subtitle="Head-to-head profile analysis — solved counts, topic coverage, difficulty distribution, weakness gaps, and an AI plan to catch up."
        />
        <GlassCard className="mt-14 overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <ProfileCard handle="you" rating="1642" tone="primary" />
            <div className="my-auto text-center font-display text-3xl font-semibold text-muted-foreground">
              vs
            </div>
            <ProfileCard handle="tourist" rating="3810" tone="warning" />
          </div>
          <div className="grid gap-4 border-t border-white/10 p-6 md:grid-cols-4">
            {[
              ["Solved", "412", "9,140"],
              ["Coverage", "58%", "97%"],
              ["Contests", "38", "612"],
              ["Acceptance", "42%", "71%"],
            ].map(([label, a, b]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-semibold text-primary">{a}</span>
                  <span className="font-mono text-sm text-muted-foreground">{b}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 bg-primary/5 p-6">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
              <Sparkles className="size-3" /> AI catch-up plan
            </div>
            <p className="text-sm text-foreground/90">
              You're missing coverage on <span className="font-mono text-primary">segment trees</span>,{" "}
              <span className="font-mono text-primary">flows</span>, and{" "}
              <span className="font-mono text-primary">DP on trees</span>. Solving 3 problems from each per
              week for 6 weeks closes ~70% of the gap.
            </p>
          </div>
        </GlassCard>
      </div>
    </Scene3D>
  );
}

function ProfileCard({ handle, rating, tone }: { handle: string; rating: string; tone: "primary" | "warning" }) {
  const toneCls = tone === "warning" ? "text-amber-300" : "text-primary";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-transparent font-display text-lg font-semibold">
        {handle.charAt(0).toUpperCase()}
      </div>
      <div className="mt-2 font-mono text-sm text-muted-foreground">{handle}</div>
      <div className={cn("mt-1 font-display text-3xl font-semibold", toneCls)}>{rating}</div>
    </div>
  );
}

/* ============================================================
 * ROADMAP / COMMUNITY
 * ============================================================ */

function SectionRoadmap() {
  return (
    <Scene3D id="community" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <EyebrowBadge icon={Users}>Community</EyebrowBadge>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Learn together. <span className="text-primary">Share better.</span>
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Publish your sheets and roadmaps. Bookmark editorials. Import a legend's practice
              set with one click. Everything on Verdiqx revolves around learning, not likes.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
              {["Publish sheets", "Publish roadmaps", "Share notes", "Templates", "Editorials", "Learning collections"].map(
                (c) => (
                  <div key={c} className="flex items-center gap-1.5 text-foreground/90">
                    <ChevronRight className="size-3.5 text-primary" /> {c}
                  </div>
                ),
              )}
            </div>
          </div>
          <GlassCard>
            <div className="border-b border-white/5 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Compass className="size-3.5 text-primary" /> Trending on Verdiqx
              </span>
            </div>
            <div className="space-y-2 p-4">
              {[
                { name: "Road to Master · 200-problem sheet", by: "@um_nik", saves: "1.2k" },
                { name: "DP for beginners · guided roadmap", by: "@errichto", saves: "3.4k" },
                { name: "Segment tree drills · 40 problems", by: "@ecnerwala", saves: "980" },
                { name: "Weekly contest prep · Div.2", by: "@jiangly", saves: "2.1k" },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">by {r.by}</div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Star className="size-3 text-primary" /> {r.saves}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </Scene3D>
  );
}

/* ============================================================
 * TESTIMONIALS
 * ============================================================ */

const TESTIMONIALS = [
  {
    quote:
      "I went from 1400 to 1720 in 3 months. The mentor calling out my DP weakness on day one was worth the price alone.",
    who: "aarav_s",
    role: "IIIT-H, expert",
  },
  {
    quote:
      "Generating a 40-problem sheet from tourist's profile in 3 seconds is unreal. This is the tool CP has been missing for 10 years.",
    who: "kthulhu",
    role: "ICPC Regionalist",
  },
  {
    quote:
      "AI Explain replaces my 45-minute editorial dive with a 60-second read. Everything is here.",
    who: "maria.z",
    role: "IOI 2024 finalist",
  },
];

function SectionTestimonials() {
  return (
    <Scene3D id="testimonials" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHead
          eyebrow="Loved by CP folks"
          title="Trusted by contestants who ship rating gains."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.who}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="mb-3 flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="size-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="grid size-7 place-items-center rounded-full bg-primary/20 font-mono text-[11px] font-semibold text-primary">
                  {t.who.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-mono text-foreground">{t.who}</div>
                  <div>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Scene3D>
  );
}

/* ============================================================
 * FAQ
 * ============================================================ */

const FAQS = [
  {
    q: "Is Verdiqx just another CP tracker?",
    a: "No. Verdiqx is an AI-native workspace — generate sheets from any handle, get one-click AI explanations, and train with a mentor that reads your real submission history. Trackers just count. Verdiqx coaches.",
  },
  {
    q: "Which platforms do you support?",
    a: "Codeforces first (deepest integration). AtCoder, CodeChef, LeetCode, and USACO are supported for contest tracking and sheet generation.",
  },
  {
    q: "Do I need to connect my Codeforces handle?",
    a: "Only to unlock personalized features: mentor, weak-topic analysis, personalized recommendations. Sheet generation, AI Explain, and contest tools work without it.",
  },
  {
    q: "What AI model powers Mentor and Explain?",
    a: "Verdiqx uses frontier LLMs tuned on competitive-programming editorials, contest data, and your own submission history. You never see a generic AI response.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your submission history and mentor conversations stay in your account. We never train third-party models on your data.",
  },
];

function SectionFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Scene3D id="faq" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <SectionHead eyebrow="FAQ" title="Answers, before you ask." />
        <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
          {FAQS.map((f, i) => (
            <button
              key={f.q}
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full px-5 py-4 text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-display text-base font-medium">{f.q}</span>
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    open === i && "rotate-90 text-primary",
                  )}
                />
              </div>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="pt-2 text-sm text-muted-foreground">{f.a}</p>
              </motion.div>
            </button>
          ))}
        </div>
      </div>
    </Scene3D>
  );
}

/* ============================================================
 * CTA
 * ============================================================ */

function SectionCta() {
  return (
    <Scene3D id="pricing" className="relative py-28 md:py-40 lg:py-48">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-10 text-center md:p-16">
          <div className="absolute inset-0 -z-10 opacity-70" style={{
            background:
              "radial-gradient(70% 70% at 50% 0%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 70%)",
          }} />
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-background/50 px-3 py-1 text-xs text-primary">
            <Sparkles className="size-3" /> Free while in beta
          </div>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Practice smarter, not longer.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
            Join competitive programmers already using Verdiqx to hit their next rating goal.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 gap-2 rounded-full px-6 shadow-xl shadow-primary/40">
              <Link to="/auth">
                Get started free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
              <Link to="/problems">Explore the dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </Scene3D>
  );
}

/* ============================================================
 * FOOTER
 * ============================================================ */

function MarketingFooter() {
  return (
    <footer className="border-t border-white/5 py-16 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="font-display text-sm font-semibold">Verdiqx</span>
          <span className="ml-2 text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href="#" className="grid size-8 place-items-center rounded-full border border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary">
            <Twitter className="size-3.5" />
          </a>
          <a href="#" className="grid size-8 place-items-center rounded-full border border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary">
            <Github className="size-3.5" />
          </a>
          <a href="#" className="grid size-8 place-items-center rounded-full border border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary">
            <MessageSquare className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
 * PRIMITIVES
 * ============================================================ */

function FadeUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </div>
      <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-pretty md:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function EyebrowBadge({ children, icon: Icon }: { children: ReactNode; icon: typeof Bot }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
      <Icon className="size-3" /> {children}
    </div>
  );
}

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 20 });
  const sry = useSpring(ry, { stiffness: 120, damping: 20 });
  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rx.set(-py * 4);
        ry.set(px * 4);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-2xl shadow-primary/10 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
