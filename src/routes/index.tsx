import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdiqx" },
      { name: "description", content: "A simple home page." },
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
