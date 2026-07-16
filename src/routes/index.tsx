import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdiqx — Practice tools for competitive programmers" },
      {
        name: "description",
        content:
          "Verdiqx helps competitive programmers organize practice with curated sheets, problem tracking, contest calendars and video walkthroughs.",
      },
      { property: "og:title", content: "Verdiqx — Practice tools for competitive programmers" },
      {
        property: "og:description",
        content:
          "Curated sheets, problem tracking, contest calendars and video walkthroughs for competitive programmers.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    title: "Practice sheets",
    body: "Curated problem sets organized by topic and difficulty so you always know what to solve next.",
  },
  {
    title: "Problem tracker",
    body: "Keep a record of solved problems, mistakes and revision notes across your Codeforces history.",
  },
  {
    title: "Contest calendar",
    body: "Upcoming rounds from major judges in one place, with reminders before each contest starts.",
  },
  {
    title: "Video walkthroughs",
    body: "Look up any Codeforces problem and pull the best available YouTube editorial in a click.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            Verdiqx
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/problems"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Dashboard
            </Link>
            <Button asChild size="sm" variant="ghost">
              <Link to="/auth">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 sm:py-28">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Practice tools for competitive programmers.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Verdiqx is a small toolkit for organizing your Codeforces practice —
            sheets, tracking, contest reminders and editorials in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/problems">Open Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Create an account</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border/60 py-16">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            What's inside
          </h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 py-16">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            How it works
          </h2>
          <ol className="mt-8 space-y-6">
            <li className="flex gap-4">
              <span className="text-sm font-mono text-muted-foreground">01</span>
              <div>
                <div className="text-base font-semibold">Sign in</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create an account and connect your Codeforces handle.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="text-sm font-mono text-muted-foreground">02</span>
              <div>
                <div className="text-base font-semibold">Pick a sheet</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose from curated problem sets or generate one for a topic.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="text-sm font-mono text-muted-foreground">03</span>
              <div>
                <div className="text-base font-semibold">Practice and track</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Solve, log mistakes, and watch editorials when you're stuck.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="border-t border-border/60 py-16">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready to start?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                It's free to try. No setup required.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Verdiqx</div>
          <div className="flex gap-4">
            <Link to="/problems" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link to="/auth" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
