import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Target,
  CalendarDays,
  PlayCircle,
  LineChart,
  Bot,
  Check,
  Code2,
  Trophy,
  Flame,
  Github,
  Twitter,
  Youtube,
  Zap,
  Layers,
  Compass,
  MessageSquare,
  Rocket,
} from "lucide-react";
import heroImage from "@/assets/home-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdiqx — Practice tools for competitive programmers" },
      {
        name: "description",
        content:
          "Curated sheets, problem tracking, contest calendars and video walkthroughs — an organized workspace for competitive programmers.",
      },
      {
        property: "og:title",
        content: "Verdiqx — Practice tools for competitive programmers",
      },
      {
        property: "og:description",
        content:
          "Curated sheets, problem tracking, contest calendars and video walkthroughs.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="landing-root min-h-dvh bg-[var(--lp-bg)] text-[rgb(var(--lp-ink))] transition-colors duration-500">
      <Hero />
      <Stats />
      <TopicsMarquee />
      <ProblemSolution />
      <Features />
      <FeatureSpotlight />
      <HowItWorks />
      <Showcase />
      <Compare />
      <Integrations />
      <Roadmap />
      <Testimonials />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 });
  const sy = useSpring(my, { stiffness: 60, damping: 15 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [8, -8]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-6, 6]);
  const bgX = useTransform(sx, [-0.5, 0.5], [30, -30]);
  const bgY = useTransform(sy, [-0.5, 0.5], [18, -18]);
  const bgRotY = useTransform(sx, [-0.5, 0.5], [-3, 3]);
  const bgRotX = useTransform(sy, [-0.5, 0.5], [2, -2]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["35%", "65%"]);
  const glowY = useTransform(sy, [-0.5, 0.5], ["25%", "55%"]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="landing-hero relative overflow-hidden [perspective:1600px]"
    >
      {/* Hero background — layered 3D */}
      <motion.div
        aria-hidden
        style={{
          x: bgX,
          y: bgY,
          rotateX: bgRotX,
          rotateY: bgRotY,
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-[-4%] [transform-style:preserve-3d]"
      >
        <motion.img
          src={heroImage}
          alt=""
          width={1920}
          height={1280}
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{
            scale: [1.15, 1.22, 1.15],
            opacity: 1,
          }}
          transition={{
            opacity: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
            scale: {
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="absolute inset-0 h-full w-full object-cover [will-change:transform]"
          style={{ transform: "translateZ(-80px)" }}
        />

        {/* Aurora glows */}
        <motion.div
          aria-hidden
          animate={{ opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ left: glowX, top: glowY, transform: "translate(-50%, -50%) translateZ(-20px)" }}
          className="pointer-events-none absolute size-[60vmax] rounded-full bg-[radial-gradient(closest-side,rgba(120,150,255,0.35),transparent_70%)] blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-40 -right-40 size-[50vmax] rounded-full bg-[radial-gradient(closest-side,rgba(80,120,255,0.35),transparent_70%)] blur-3xl"
        />

        {/* Depth gradients — react to theme */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-[var(--lp-bg)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--lp-bg)_100%)] opacity-70" />
        {/* Warm dawn tint in light mode only */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,215,175,0.32),rgba(255,170,190,0.20)_40%,transparent_75%)] opacity-100 dark:opacity-0 transition-opacity duration-700" />

        {/* Grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
          }}
        />
      </motion.div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--lp-ink)/90%)] px-4 py-1.5 text-sm font-semibold text-black backdrop-blur"
        >
          <span className="grid size-5 place-items-center rounded-full bg-black text-[rgb(var(--lp-ink))] text-[10px]">
            V
          </span>
          Verdiqx
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[rgb(var(--lp-ink)/80%)] md:flex">
          <a href="#features" className="hover:text-[rgb(var(--lp-ink))]">Features</a>
          <a href="#how" className="hover:text-[rgb(var(--lp-ink))]">How it works</a>
          <a href="#showcase" className="hover:text-[rgb(var(--lp-ink))]">Showcase</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle className="border-[rgb(var(--lp-ink)/25%)] bg-[rgb(var(--lp-ink)/10%)] text-[rgb(var(--lp-ink))] hover:bg-[rgb(var(--lp-ink)/20%)] hover:text-[rgb(var(--lp-ink))]" />
          <Button
            asChild
            className="rounded-full bg-[rgb(var(--lp-ink))] text-black hover:bg-[rgb(var(--lp-ink)/90%)]"
          >
            <Link to="/auth">Sign up</Link>
          </Button>
        </div>
      </header>

      {/* Hero content */}
      <motion.main
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-10 mx-auto flex min-h-[calc(100dvh-88px)] max-w-4xl flex-col items-center justify-center px-6 pb-24 pt-8 text-center [will-change:transform]"
      >
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: "translateZ(40px)" }}
          className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--lp-ink)/15%)] px-4 py-1.5 text-xs font-medium text-[rgb(var(--lp-ink))] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-md"
        >
          <Sparkles className="size-3.5" />
          Built for Codeforces practice
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: "translateZ(80px)" }}
          className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-[rgb(var(--lp-ink))] [text-shadow:0_10px_40px_rgba(0,0,0,0.35)] sm:text-6xl md:text-7xl"
        >
          Practice worth
          <br />
          <em className="font-serif italic font-normal">showing up for.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: "translateZ(50px)" }}
          className="mt-6 max-w-xl text-base leading-relaxed text-[rgb(var(--lp-ink)/85%)] sm:text-lg"
        >
          Curated problem sheets, honest progress tracking, contest reminders
          and video walkthroughs — your competitive programming workspace, in
          one calm place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: "translateZ(70px)" }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="mt-8"
        >
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-black px-6 text-[rgb(var(--lp-ink))] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] hover:bg-black/85"
          >
            <Link to="/auth" className="inline-flex items-center gap-2">
              <ArrowRight className="size-4" />
              Get started
            </Link>
          </Button>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          style={{ transform: "translateZ(30px)" }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[rgb(var(--lp-ink)/80%)]"
        >
          <li>Free to use</li>
          <li aria-hidden className="size-1 rounded-full bg-[rgb(var(--lp-ink)/50%)]" />
          <li>Codeforces integrated</li>
          <li aria-hidden className="size-1 rounded-full bg-[rgb(var(--lp-ink)/50%)]" />
          <li>Video editorials built-in</li>
        </motion.ul>
      </motion.main>
    </section>
  );
}

function Stats() {
  const items = [
    { value: "12k+", label: "Curated problems" },
    { value: "40+", label: "Practice sheets" },
    { value: "300+", label: "Video editorials" },
    { value: "24/7", label: "Contest tracker" },
  ];
  return (
    <section className="border-y border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-elev)]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-6 py-14 sm:px-10 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-4xl font-semibold text-[rgb(var(--lp-ink))]">
              {s.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[rgb(var(--lp-ink)/55%)]">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: BookOpen,
    title: "Curated sheets",
    body: "Handpicked problem sets from top competitive programmers, grouped by topic and difficulty.",
  },
  {
    icon: Target,
    title: "Problem tracker",
    body: "Log every attempt, tag your mistakes, and revisit weak spots with spaced repetition.",
  },
  {
    icon: CalendarDays,
    title: "Contest calendar",
    body: "Never miss a round. See upcoming contests from Codeforces, AtCoder and more in one view.",
  },
  {
    icon: PlayCircle,
    title: "Video walkthroughs",
    body: "Embedded editorials from trusted creators, matched to the exact problem you're solving.",
  },
  {
    icon: LineChart,
    title: "Progress analytics",
    body: "Rating history, topic mastery and streaks — honest metrics, no vanity numbers.",
  },
  {
    icon: Bot,
    title: "AI mentor",
    body: "Stuck on a problem? Get hints that guide you, never solutions that spoil the moment.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-[var(--lp-bg)] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
            Everything in one place
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
            The workspace built{" "}
            <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
              around your practice.
            </em>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[rgb(var(--lp-ink)/70%)]">
            Stop juggling five tabs and a spreadsheet. Verdiqx pulls your
            problems, progress, contests and editorials into a single quiet
            surface.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-[rgb(var(--lp-ink)/10%)] bg-[rgb(var(--lp-ink)/10%)] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
             className="tilt-3d group relative bg-[var(--lp-bg)] p-8 transition-colors hover:bg-[var(--lp-elev)]"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[rgb(var(--lp-ink)/10%)] text-[rgb(var(--lp-ink))]">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-[rgb(var(--lp-ink))]">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--lp-ink)/65%)]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Link your handle",
    body: "Connect your Codeforces handle in seconds. We pull your solved set and rating history automatically.",
  },
  {
    n: "02",
    title: "Pick a sheet",
    body: "Start with a curated ladder or build your own. Filter by rating, tag or difficulty in one click.",
  },
  {
    n: "03",
    title: "Practice and reflect",
    body: "Solve, log mistakes, watch the editorial. Come back tomorrow — Verdiqx remembers where you left off.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how"
      className="relative border-t border-[rgb(var(--lp-ink)/10%)] bg-gradient-to-b from-[var(--lp-bg)] to-[var(--lp-elev)] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
              Three steps.{" "}
              <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
                No noise.
              </em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[rgb(var(--lp-ink)/65%)]">
            Verdiqx is opinionated about what matters and quiet about what
            doesn't. You show up, we handle the rest.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
             className="tilt-3d rounded-2xl border border-[rgb(var(--lp-ink)/10%)] bg-[rgb(var(--lp-ink)/3%)] p-8 backdrop-blur"
            >
              <div className="font-mono text-xs tracking-widest text-[rgb(var(--lp-ink)/45%)]">
                {s.n}
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-[rgb(var(--lp-ink))]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--lp-ink)/65%)]">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Showcase() {
  const bullets = [
    "Solved / unsolved status pulled live from Codeforces",
    "Notes and mistake tags stay with each problem",
    "Sheet progress with per-tag breakdown",
    "One-click editorial and video for every problem",
  ];
  return (
    <section
      id="showcase"
      className="border-t border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-elev)] py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-14 px-6 sm:px-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
            Showcase
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
            A problem list you'll{" "}
            <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
              actually finish.
            </em>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[rgb(var(--lp-ink)/70%)]">
            Every sheet is a real practice plan — not a wall of links. Track
            what you've solved, what you skipped, and what's worth revisiting.
          </p>
          <ul className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-[rgb(var(--lp-ink)/80%)]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[rgb(var(--lp-ink)/10%)]">
                  <Check className="size-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Faux product panel */}
        <div className="rounded-2xl border border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-bg)] p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[rgb(var(--lp-ink)/10%)] pb-4">
            <div>
              <div className="text-sm font-semibold text-[rgb(var(--lp-ink))]">
                Graph Theory · Ladder A
              </div>
              <div className="text-xs text-[rgb(var(--lp-ink)/55%)]">
                18 of 24 solved · 1200–1600
              </div>
            </div>
            <div className="rounded-full bg-[rgb(var(--lp-ink)/10%)] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[rgb(var(--lp-ink)/70%)]">
              In progress
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { id: "1520C", name: "Not Adjacent Matrix", tag: "constructive", done: true },
              { id: "1213D2", name: "Equalizing by Division", tag: "sortings", done: true },
              { id: "1741E", name: "Sending a Sequence Over the Network", tag: "dp", done: false },
              { id: "1620D", name: "Exact Change", tag: "brute force", done: true },
              { id: "1701D", name: "Permutation Restoration", tag: "greedy", done: false },
            ].map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-[rgb(var(--lp-ink)/500%)] bg-[rgb(var(--lp-ink)/2%)] px-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`size-2 rounded-full ${
                      p.done ? "bg-emerald-400" : "bg-[rgb(var(--lp-ink)/25%)]"
                    }`}
                  />
                  <span className="font-mono text-xs text-[rgb(var(--lp-ink)/55%)]">
                    {p.id}
                  </span>
                  <span className="text-[rgb(var(--lp-ink)/90%)]">{p.name}</span>
                </div>
                <span className="hidden text-[10px] uppercase tracking-widest text-[rgb(var(--lp-ink)/45%)] sm:inline">
                  {p.tag}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--lp-ink)/10%)]">
            <div className="h-full w-3/4 rounded-full bg-[rgb(var(--lp-ink)/70%)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

const QUOTES = [
  {
    quote:
      "I stopped bookmarking problems. Verdiqx just knows what I've solved, what I skipped, and what to try next.",
    name: "Aditya R.",
    role: "Expert · Codeforces",
  },
  {
    quote:
      "The mistake tags changed how I practice. I finally see the patterns I keep failing on.",
    name: "Sana K.",
    role: "Candidate Master",
  },
  {
    quote:
      "Contest reminders + editorial videos in the same place. This is what I wanted for three years.",
    name: "Leo M.",
    role: "ICPC regional",
  },
];

function Testimonials() {
  return (
    <section className="border-t border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-bg)] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
          Loved by the grind
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
          Built by people who{" "}
          <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
            still practice.
          </em>
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure
              key={q.name}
               className="tilt-3d flex h-full flex-col justify-between rounded-2xl border border-[rgb(var(--lp-ink)/10%)] bg-[rgb(var(--lp-ink)/3%)] p-8"
            >
              <blockquote className="text-base leading-relaxed text-[rgb(var(--lp-ink)/85%)]">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 border-t border-[rgb(var(--lp-ink)/10%)] pt-4">
                <div className="text-sm font-semibold text-[rgb(var(--lp-ink))]">{q.name}</div>
                <div className="text-xs text-[rgb(var(--lp-ink)/55%)]">{q.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-elev)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(closest-side,_rgba(120,150,255,0.25),_transparent)]"
      />
      <div className="relative mx-auto max-w-3xl px-6 py-28 text-center sm:px-10">
        <h2 className="font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-6xl">
          Start practicing today.
          <br />
          <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/85%)]">
            Show up tomorrow.
          </em>
        </h2>
        <p className="mt-6 text-base leading-relaxed text-[rgb(var(--lp-ink)/70%)]">
          Free to use, no credit card, no seat limits. Bring your handle and
          we'll take it from there.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[rgb(var(--lp-ink))] px-6 text-black hover:bg-[rgb(var(--lp-ink)/90%)]"
          >
            <Link to="/auth" className="inline-flex items-center gap-2">
              Create your account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-full px-6 text-[rgb(var(--lp-ink))] hover:bg-[rgb(var(--lp-ink)/10%)] hover:text-[rgb(var(--lp-ink))]"
          >
            <Link to="/problems">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-bg)]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 text-sm text-[rgb(var(--lp-ink)/60%)] sm:px-10 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-[rgb(var(--lp-ink))]">
          <span className="grid size-6 place-items-center rounded-full bg-[rgb(var(--lp-ink))] text-black text-[11px] font-bold">
            V
          </span>
          <span className="font-semibold">Verdiqx</span>
          <span className="text-[rgb(var(--lp-ink)/40%)]">— practice, tracked.</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#features" className="hover:text-[rgb(var(--lp-ink))]">Features</a>
          <a href="#how" className="hover:text-[rgb(var(--lp-ink))]">How it works</a>
          <Link to="/problems" className="hover:text-[rgb(var(--lp-ink))]">Dashboard</Link>
          <Link to="/auth" className="hover:text-[rgb(var(--lp-ink))]">Sign in</Link>
        </div>
        <div className="text-xs text-[rgb(var(--lp-ink)/40%)]">
          © {new Date().getFullYear()} Verdiqx
        </div>
      </div>
    </footer>
  );
}

/* ================= Additional sections ================= */

const TOPICS = [
  "Dynamic Programming",
  "Graphs",
  "Number Theory",
  "Greedy",
  "Data Structures",
  "Binary Search",
  "Segment Trees",
  "DP on Trees",
  "Bitmasks",
  "Geometry",
  "Strings",
  "Combinatorics",
  "Flows",
  "Game Theory",
  "Interactive",
];

function TopicsMarquee() {
  return (
    <section className="relative overflow-hidden border-y border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-bg)] py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--lp-scrim-to)] to-[var(--lp-scrim-from)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--lp-scrim-to)] to-[var(--lp-scrim-from)]" />
      <div className="flex gap-3 overflow-x-auto px-6 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[...TOPICS, ...TOPICS].map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="whitespace-nowrap rounded-full border border-[rgb(var(--lp-ink)/10%)] bg-[rgb(var(--lp-ink)/4%)] px-4 py-1.5 text-xs text-[rgb(var(--lp-ink)/70%)]"
          >
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProblemSolution() {
  const pain = [
    "Solved lists lost in 12 browser tabs",
    "No idea which topic is actually weak",
    "Editorials scattered across YouTube",
    "Contests missed because timezones",
  ];
  const cure = [
    "One workspace, one source of truth",
    "Topic mastery + mistake tags surfaced",
    "Editorial videos next to each problem",
    "Local-time reminders before every round",
  ];
  return (
    <section className="border-b border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-bg)] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
            Why Verdiqx
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
            Practice is hard.{" "}
            <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
              The tooling shouldn't be.
            </em>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.04] p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-red-300/80">
              Without Verdiqx
            </div>
            <ul className="mt-6 space-y-3 text-sm text-[rgb(var(--lp-ink)/75%)]">
              {pain.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-400/70" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              With Verdiqx
            </div>
            <ul className="mt-6 space-y-3 text-sm text-[rgb(var(--lp-ink)/85%)]">
              {cure.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSpotlight() {
  return (
    <section className="border-t border-[rgb(var(--lp-ink)/10%)] bg-gradient-to-b from-[var(--lp-bg)] via-[var(--lp-panel)] to-[var(--lp-bg)] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl space-y-24 px-6 sm:px-10">
        {/* Row 1 */}
        <div className="grid gap-14 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--lp-ink)/10%)] px-3 py-1 text-[10px] uppercase tracking-widest text-[rgb(var(--lp-ink)/70%)]">
              <Zap className="size-3" /> Mastery engine
            </div>
            <h3 className="mt-4 font-display text-3xl font-semibold text-[rgb(var(--lp-ink))] sm:text-4xl">
              Know exactly where you stand,{" "}
              <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
                topic by topic.
              </em>
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[rgb(var(--lp-ink)/70%)]">
              Every solve, skip, and mistake feeds a per-topic score. See the
              tag you keep failing, the range you've outgrown, and the next
              problem worth your time.
            </p>
          </div>
          <MasteryCard />
        </div>

        {/* Row 2 reversed */}
        <div className="grid gap-14 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1 rounded-2xl border border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-panel)] p-6">
            <div className="flex items-center justify-between border-b border-[rgb(var(--lp-ink)/10%)] pb-3 text-xs text-[rgb(var(--lp-ink)/60%)]">
              <span className="font-mono">Round #952 · Div 2</span>
              <span className="rounded-full bg-[rgb(var(--lp-ink)/10%)] px-2 py-0.5 text-[10px] uppercase tracking-widest">
                in 2h 14m
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { t: "Educational Codeforces Round 168", d: "Tomorrow · 20:35" },
                { t: "AtCoder Beginner Contest 379", d: "Sat · 17:30" },
                { t: "Codeforces Round 953 (Div 3)", d: "Sun · 20:05" },
              ].map((c) => (
                <div
                  key={c.t}
                  className="flex items-center justify-between rounded-lg bg-[rgb(var(--lp-ink)/3%)] px-3 py-2.5 text-sm"
                >
                  <span className="text-[rgb(var(--lp-ink)/85%)]">{c.t}</span>
                  <span className="font-mono text-xs text-[rgb(var(--lp-ink)/50%)]">{c.d}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--lp-ink)/10%)] px-3 py-1 text-[10px] uppercase tracking-widest text-[rgb(var(--lp-ink)/70%)]">
              <CalendarDays className="size-3" /> Contest radar
            </div>
            <h3 className="mt-4 font-display text-3xl font-semibold text-[rgb(var(--lp-ink))] sm:text-4xl">
              Never miss a round{" "}
              <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
                that matters.
              </em>
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[rgb(var(--lp-ink)/70%)]">
              A single calendar for Codeforces, AtCoder, CodeChef and more.
              Filter by division, set gentle reminders, add rounds to your own
              calendar in one click.
            </p>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid gap-14 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--lp-ink)/10%)] px-3 py-1 text-[10px] uppercase tracking-widest text-[rgb(var(--lp-ink)/70%)]">
              <Bot className="size-3" /> Mentor
            </div>
            <h3 className="mt-4 font-display text-3xl font-semibold text-[rgb(var(--lp-ink))] sm:text-4xl">
              Hints when you're stuck,{" "}
              <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
                never the answer.
              </em>
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[rgb(var(--lp-ink)/70%)]">
              Ask for a nudge and get one — a question, a technique to try, a
              pattern to recognize. The mentor refuses to spoil the ending.
            </p>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-panel)] p-6 font-mono text-xs leading-relaxed text-[rgb(var(--lp-ink)/80%)]">
            <div className="text-[rgb(var(--lp-ink)/45%)]">you</div>
            <div className="mt-1">
              I've tried DP on this but it's O(n²). Help?
            </div>
            <div className="mt-5 text-[rgb(var(--lp-ink)/45%)]">mentor</div>
            <div className="mt-1 text-[rgb(var(--lp-ink)/90%)]">
              Which quantity is monotone as you sweep from left to right? If
              you find one, a data structure over indices might drop the inner
              loop.
            </div>
            <div className="mt-5 flex gap-2">
              <span className="rounded-full bg-[rgb(var(--lp-ink)/10%)] px-2 py-1 text-[10px] uppercase tracking-widest">
                nudge
              </span>
              <span className="rounded-full bg-[rgb(var(--lp-ink)/10%)] px-2 py-1 text-[10px] uppercase tracking-widest">
                no spoilers
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Compare() {
  const rows = [
    { f: "Curated sheets by rating band", verdiqx: true, others: "Kind of" },
    { f: "Mistake tags & spaced review", verdiqx: true, others: false },
    { f: "Editorial videos inline", verdiqx: true, others: false },
    { f: "Unified contest calendar", verdiqx: true, others: "Some" },
    { f: "AI mentor without spoilers", verdiqx: true, others: false },
    { f: "Free, no paywall", verdiqx: true, others: "Freemium" },
  ];
  return (
    <section className="border-t border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-bg)] py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
          Compare
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
          What you get{" "}
          <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
            versus everywhere else.
          </em>
        </h2>

        <div className="mt-12 overflow-hidden rounded-2xl border border-[rgb(var(--lp-ink)/10%)]">
          <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-[rgb(var(--lp-ink)/10%)] bg-[rgb(var(--lp-ink)/3%)] text-xs uppercase tracking-widest text-[rgb(var(--lp-ink)/60%)]">
            <div className="px-6 py-4">Feature</div>
            <div className="px-6 py-4 text-[rgb(var(--lp-ink))]">Verdiqx</div>
            <div className="px-6 py-4">Elsewhere</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.f}
              className={`grid grid-cols-[1.6fr_1fr_1fr] items-center text-sm ${
                i % 2 === 0 ? "bg-transparent" : "bg-[rgb(var(--lp-ink)/2%)]"
              }`}
            >
              <div className="px-6 py-4 text-[rgb(var(--lp-ink)/85%)]">{r.f}</div>
              <div className="px-6 py-4">
                <Check className="size-4 text-emerald-300" />
              </div>
              <div className="px-6 py-4 text-[rgb(var(--lp-ink)/60%)]">
                {r.others === false ? (
                  <span className="text-[rgb(var(--lp-ink)/30%)]">—</span>
                ) : r.others === true ? (
                  <Check className="size-4 text-[rgb(var(--lp-ink)/50%)]" />
                ) : (
                  r.others
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  const items = [
    { icon: Code2, name: "Codeforces" },
    { icon: Trophy, name: "AtCoder" },
    { icon: Layers, name: "CodeChef" },
    { icon: Flame, name: "LeetCode" },
    { icon: Github, name: "GitHub" },
    { icon: Youtube, name: "YouTube" },
  ];
  return (
    <section className="border-t border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-elev)] py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
              Integrations
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
              Plays well with{" "}
              <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
                your stack.
              </em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[rgb(var(--lp-ink)/65%)]">
            Pull data from where you already practice. No re-solving, no
            manual imports.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[rgb(var(--lp-ink)/10%)] bg-[rgb(var(--lp-ink)/10%)] sm:grid-cols-3 md:grid-cols-6">
          {items.map((it) => (
            <div
              key={it.name}
              className="flex flex-col items-center justify-center gap-3 bg-[var(--lp-elev)] py-10 text-center transition-colors hover:bg-[var(--lp-elev)]"
            >
              <it.icon className="size-6 text-[rgb(var(--lp-ink)/75%)]" />
              <span className="text-xs uppercase tracking-widest text-[rgb(var(--lp-ink)/60%)]">
                {it.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const items = [
    {
      icon: Rocket,
      status: "Shipped",
      title: "Curated sheets & tracker",
      body: "Ladder sheets across every rating band with per-problem notes.",
    },
    {
      icon: Compass,
      status: "Shipped",
      title: "Contest radar",
      body: "Multi-platform contest calendar with local-time reminders.",
    },
    {
      icon: Bot,
      status: "In beta",
      title: "AI mentor",
      body: "Hint-only assistant tuned for competitive programming patterns.",
    },
    {
      icon: MessageSquare,
      status: "Next",
      title: "Study groups",
      body: "Practice with friends, share sheets and compare mistake logs.",
    },
  ];
  return (
    <section className="border-t border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-bg)] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
          Roadmap
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
          Built in public,{" "}
          <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
            shipped every week.
          </em>
        </h2>

        <ol className="relative mt-14 space-y-8 border-l border-[rgb(var(--lp-ink)/10%)] pl-8">
          {items.map((r) => (
            <li key={r.title} className="relative">
              <span className="absolute -left-[41px] top-1 grid size-8 place-items-center rounded-full border border-[rgb(var(--lp-ink)/15%)] bg-[var(--lp-elev)]">
                <r.icon className="size-4 text-[rgb(var(--lp-ink)/80%)]" />
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-xl font-semibold text-[rgb(var(--lp-ink))]">
                  {r.title}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    r.status === "Shipped"
                      ? "bg-emerald-400/15 text-emerald-300"
                      : r.status === "In beta"
                      ? "bg-amber-400/15 text-amber-200"
                      : "bg-[rgb(var(--lp-ink)/10%)] text-[rgb(var(--lp-ink)/70%)]"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[rgb(var(--lp-ink)/65%)]">
                {r.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Is Verdiqx really free?",
    a: "Yes. Every feature above is free while we're in early access. No credit card, no seat limits, no dark-pattern trials.",
  },
  {
    q: "Do I need a Codeforces account?",
    a: "You can browse without one. To sync your solved set and rating history, you just paste your handle — no OAuth, no password.",
  },
  {
    q: "Will the AI mentor spoil solutions?",
    a: "No. It's tuned to give hints, ask leading questions and suggest techniques. It refuses to write full solutions.",
  },
  {
    q: "Which judges do you support?",
    a: "Codeforces is first-class today. AtCoder, CodeChef and LeetCode integrations are rolling out over the next release cycle.",
  },
  {
    q: "Can I import my own problem list?",
    a: "Yes. Paste a list of problem URLs or IDs and Verdiqx builds a sheet with tags, ratings and editorials attached.",
  },
];

function Faq() {
  return (
    <section className="border-t border-[rgb(var(--lp-ink)/10%)] bg-[var(--lp-bg)] py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--lp-ink)/55%)]">
          Questions
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[rgb(var(--lp-ink))] sm:text-5xl">
          Everything else,{" "}
          <em className="font-serif italic font-normal text-[rgb(var(--lp-ink)/80%)]">
            answered.
          </em>
        </h2>

        <div className="mt-12 divide-y divide-[rgb(var(--lp-ink)/10%)] border-y border-[rgb(var(--lp-ink)/10%)]">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group py-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left">
                <span className="font-display text-lg font-medium text-[rgb(var(--lp-ink))]">
                  {f.q}
                </span>
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[rgb(var(--lp-ink)/15%)] text-[rgb(var(--lp-ink)/70%)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[rgb(var(--lp-ink)/70%)]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function MasteryCard() {
  const topics = [
    { name: "Graphs", pct: 82 },
    { name: "DP", pct: 61 },
    { name: "Number Theory", pct: 44 },
    { name: "Greedy", pct: 74 },
    { name: "Data Structures", pct: 58 },
  ];
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const rY = useTransform(sx, [-0.5, 0.5], [12, -12]);
  const rX = useTransform(sy, [-0.5, 0.5], [-10, 10]);
  const gX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);
  const gY = useTransform(sy, [-0.5, 0.5], ["10%", "90%"]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div className="[perspective:1400px]">
      <motion.div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d" }}
        className="group relative rounded-2xl border border-[rgb(var(--lp-ink)/12%)] bg-[var(--lp-panel)] p-6 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.55)] [will-change:transform]"
      >
        {/* Dynamic cursor sheen */}
        <Sheen gX={gX} gY={gY} />

        <div
          className="relative flex items-center justify-between border-b border-[rgb(var(--lp-ink)/10%)] pb-3"
          style={{ transform: "translateZ(40px)" }}
        >
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--lp-ink)/55%)]">
              Topic mastery
            </div>
            <div className="mt-1 font-display text-lg font-semibold text-[rgb(var(--lp-ink))]">
              Last 30 days
            </div>
          </div>
          <div className="rounded-full bg-[rgb(var(--lp-ink)/10%)] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[rgb(var(--lp-ink)/70%)]">
            live
          </div>
        </div>

        <div
          className="relative mt-4 space-y-3"
          style={{ transform: "translateZ(30px)" }}
        >
          {topics.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.6,
                delay: 0.1 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="flex justify-between text-xs">
                <span className="text-[rgb(var(--lp-ink)/85%)]">{t.name}</span>
                <motion.span
                  className="font-mono text-[rgb(var(--lp-ink)/60%)]"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                >
                  {t.pct}%
                </motion.span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--lp-ink)/8%)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${t.pct}%` }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 1.1,
                    delay: 0.2 + i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative h-full rounded-full bg-gradient-to-r from-[rgb(120,150,255)] via-[rgb(150,180,255)] to-[rgb(200,220,255)] shadow-[0_0_20px_rgba(120,150,255,0.6)]"
                >
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]"
                    animate={{ x: ["0%", "400%"] }}
                    transition={{
                      duration: 2.2,
                      delay: 1.2 + i * 0.15,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        <div
          className="relative mt-6 flex items-center justify-between border-t border-[rgb(var(--lp-ink)/10%)] pt-4 text-xs text-[rgb(var(--lp-ink)/55%)]"
          style={{ transform: "translateZ(20px)" }}
        >
          <span>Avg mastery</span>
          <span className="font-mono text-[rgb(var(--lp-ink))]">63.8%</span>
        </div>
      </motion.div>
    </div>
  );
}
