import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-dvh bg-[#050a1a] text-white">
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Showcase />
      <Testimonials />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Hero background */}
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1280}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60"
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-black backdrop-blur"
        >
          <span className="grid size-5 place-items-center rounded-full bg-black text-white text-[10px]">
            V
          </span>
          Verdiqx
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#showcase" className="hover:text-white">Showcase</a>
        </nav>
        <Button
          asChild
          className="rounded-full bg-white text-black hover:bg-white/90"
        >
          <Link to="/auth">Sign up</Link>
        </Button>
      </header>

      {/* Hero content */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-88px)] max-w-4xl flex-col items-center justify-center px-6 pb-24 pt-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <Sparkles className="size-3.5" />
          Built for Codeforces practice
        </span>

        <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
          Practice worth
          <br />
          <em className="font-serif italic font-normal">showing up for.</em>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          Curated problem sheets, honest progress tracking, contest reminders
          and video walkthroughs — your competitive programming workspace, in
          one calm place.
        </p>

        <Button
          asChild
          size="lg"
          className="mt-8 h-12 rounded-full bg-black px-6 text-white hover:bg-black/85"
        >
          <Link to="/auth" className="inline-flex items-center gap-2">
            <ArrowRight className="size-4" />
            Get started
          </Link>
        </Button>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
          <li>Free to use</li>
          <li aria-hidden className="size-1 rounded-full bg-white/50" />
          <li>Codeforces integrated</li>
          <li aria-hidden className="size-1 rounded-full bg-white/50" />
          <li>Video editorials built-in</li>
        </ul>
      </main>
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
    <section className="border-y border-white/10 bg-[#0a1230]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-6 py-14 sm:px-10 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-4xl font-semibold text-white">
              {s.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/55">
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
    <section id="features" className="bg-[#050a1a] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-white/55">
            Everything in one place
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            The workspace built{" "}
            <em className="font-serif italic font-normal text-white/80">
              around your practice.
            </em>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Stop juggling five tabs and a spreadsheet. Verdiqx pulls your
            problems, progress, contests and editorials into a single quiet
            surface.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative bg-[#050a1a] p-8 transition-colors hover:bg-[#0a1230]"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
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
      className="relative border-t border-white/10 bg-gradient-to-b from-[#050a1a] to-[#0a1230] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Three steps.{" "}
              <em className="font-serif italic font-normal text-white/80">
                No noise.
              </em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/65">
            Verdiqx is opinionated about what matters and quiet about what
            doesn't. You show up, we handle the rest.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur"
            >
              <div className="font-mono text-xs tracking-widest text-white/45">
                {s.n}
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
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
      className="border-t border-white/10 bg-[#0a1230] py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-14 px-6 sm:px-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/55">
            Showcase
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            A problem list you'll{" "}
            <em className="font-serif italic font-normal text-white/80">
              actually finish.
            </em>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Every sheet is a real practice plan — not a wall of links. Track
            what you've solved, what you skipped, and what's worth revisiting.
          </p>
          <ul className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/10">
                  <Check className="size-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Faux product panel */}
        <div className="rounded-2xl border border-white/10 bg-[#050a1a] p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-sm font-semibold text-white">
                Graph Theory · Ladder A
              </div>
              <div className="text-xs text-white/55">
                18 of 24 solved · 1200–1600
              </div>
            </div>
            <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/70">
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
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`size-2 rounded-full ${
                      p.done ? "bg-emerald-400" : "bg-white/25"
                    }`}
                  />
                  <span className="font-mono text-xs text-white/55">
                    {p.id}
                  </span>
                  <span className="text-white/90">{p.name}</span>
                </div>
                <span className="hidden text-[10px] uppercase tracking-widest text-white/45 sm:inline">
                  {p.tag}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-white/70" />
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
    <section className="border-t border-white/10 bg-[#050a1a] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-white/55">
          Loved by the grind
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Built by people who{" "}
          <em className="font-serif italic font-normal text-white/80">
            still practice.
          </em>
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure
              key={q.name}
              className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-8"
            >
              <blockquote className="text-base leading-relaxed text-white/85">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 border-t border-white/10 pt-4">
                <div className="text-sm font-semibold text-white">{q.name}</div>
                <div className="text-xs text-white/55">{q.role}</div>
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
    <section className="relative overflow-hidden border-t border-white/10 bg-[#0a1230]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(closest-side,_rgba(120,150,255,0.25),_transparent)]"
      />
      <div className="relative mx-auto max-w-3xl px-6 py-28 text-center sm:px-10">
        <h2 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Start practicing today.
          <br />
          <em className="font-serif italic font-normal text-white/85">
            Show up tomorrow.
          </em>
        </h2>
        <p className="mt-6 text-base leading-relaxed text-white/70">
          Free to use, no credit card, no seat limits. Bring your handle and
          we'll take it from there.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-white px-6 text-black hover:bg-white/90"
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
            className="h-12 rounded-full px-6 text-white hover:bg-white/10 hover:text-white"
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
    <footer className="border-t border-white/10 bg-[#050a1a]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 text-sm text-white/60 sm:px-10 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-white">
          <span className="grid size-6 place-items-center rounded-full bg-white text-black text-[11px] font-bold">
            V
          </span>
          <span className="font-semibold">Verdiqx</span>
          <span className="text-white/40">— practice, tracked.</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <Link to="/problems" className="hover:text-white">Dashboard</Link>
          <Link to="/auth" className="hover:text-white">Sign in</Link>
        </div>
        <div className="text-xs text-white/40">
          © {new Date().getFullYear()} Verdiqx
        </div>
      </div>
    </footer>
  );
}
