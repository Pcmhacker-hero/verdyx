import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
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
    <div className="relative min-h-dvh overflow-hidden bg-background text-white">
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
    </div>
  );
}
