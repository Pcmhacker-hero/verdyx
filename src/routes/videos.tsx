import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, PlayCircle, Search, Youtube, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { AppShell } from "@/components/app/app-shell";
import { CFSolutionBadge } from "@/components/app/cf-solution-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchVideos, type VideoResult } from "@/lib/videos.functions";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Video Solutions · Verdiqy" },
      {
        name: "description",
        content:
          "Look up any Codeforces problem by ID and pull the best YouTube walkthroughs, one at a time.",
      },
    ],
  }),
  component: VideosPage,
});

const CACHE_KEY = "verdiqy.video-solutions.v1";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30;

interface CacheEntry {
  results: VideoResult[];
  cachedAt: number;
}
type Cache = Record<string, CacheEntry>;

function readCache(): Cache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}
function writeCache(c: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

// Accepts "1832E", "1832 E", "1832-E", " 1832e "
function parseProblemId(raw: string): { key: string; contestId: string; index: string } | null {
  const clean = raw.trim().toUpperCase().replace(/[\s\-_/]+/g, "");
  const m = clean.match(/^(\d{1,5})([A-Z][0-9]?)$/);
  if (!m) return null;
  return { key: `${m[1]}${m[2]}`, contestId: m[1], index: m[2] };
}

function VideosPage() {
  const search = useServerFn(searchVideos);
  const [input, setInput] = useState("");
  const [problem, setProblem] = useState<{ key: string; contestId: string; index: string } | null>(
    null,
  );
  const [results, setResults] = useState<VideoResult[]>([]);
  const [visible, setVisible] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [playing, setPlaying] = useState<VideoResult | null>(null);

  const runSearch = async (parsed: { key: string; contestId: string; index: string }) => {
    setError(null);
    setResults([]);
    setVisible(1);

    const cache = readCache();
    const hit = cache[`cf:${parsed.key}`];
    if (hit && Date.now() - hit.cachedAt < CACHE_TTL && hit.results.length > 0) {
      setResults(hit.results);
      setFromCache(true);
      return;
    }

    setFromCache(false);
    setLoading(true);
    try {
      const q = `Codeforces ${parsed.contestId}${parsed.index}`;
      const r = await search({ data: { query: q } });
      setResults(r);
      if (r.length === 0) {
        setError("No videos found for that problem yet.");
      } else {
        const next = readCache();
        next[`cf:${parsed.key}`] = { results: r, cachedAt: Date.now() };
        writeCache(next);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseProblemId(input);
    if (!parsed) {
      toast.error("Enter a valid Codeforces problem ID (e.g. 1832E)");
      return;
    }
    setProblem(parsed);
    void runSearch(parsed);
  };

  const showMore = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast.error("Login required", {
        description: "Please sign in to view more video solutions.",
      });
      return;
    }
    if (visible < results.length) {
      setVisible((v) => Math.min(v + 1, results.length));
    } else {
      toast.info("No more results — try a related problem ID.");
    }
  };

  return (
    <AppShell breadcrumb={[{ label: "Video Solutions" }]}>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <div className="mb-8">
          <div className="text-2xs uppercase tracking-widest text-muted-foreground">
            Video Solutions
          </div>
          <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold">
            <Youtube className="size-7 text-red-500" />
            Find a walkthrough
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a Codeforces problem ID like <code className="rounded bg-muted px-1">1832E</code>.
            You'll get one video first — hit <span className="font-medium">More</span> to reveal
            another.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 1832E, 1856 D"
              className="h-11 pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="h-11" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {problem && (
          <div className="mb-4 flex items-center justify-between text-xs">
            <div className="text-muted-foreground">
              Searching for{" "}
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-medium text-primary">
                {problem.contestId}
                {problem.index}
              </span>
            </div>
            <div className="text-muted-foreground">
              {fromCache ? "Cached · instant" : results.length > 0 ? "Fresh results" : ""}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-14 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Searching YouTube…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <ul className="space-y-3">
              {results.slice(0, visible).map((v, idx) => (
                <li
                  key={v.videoId}
                  className="animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: `${idx * 90}ms`, animationDuration: "500ms" }}
                >
                  <button
                    type="button"
                    onClick={() => setPlaying(v)}
                    className="group flex w-full gap-3 rounded-xl border border-border/60 bg-surface/40 p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="relative aspect-video w-48 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {v.thumbnail ? (
                        <img
                          src={v.thumbnail}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground">
                          <PlayCircle className="size-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <PlayCircle className="size-12 text-white drop-shadow-lg animate-scale-in" />
                      </div>
                      {v.duration && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {v.duration}
                        </span>
                      )}
                      <span className="absolute left-1 top-1 rounded bg-gradient-to-br from-primary to-primary/70 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                        #{idx + 1}
                      </span>
                      <CFSolutionBadge />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                        {v.title}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {v.channel}
                      </div>
                      {v.views && (
                        <div className="mt-0.5 text-2xs text-muted-foreground">{v.views}</div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={showMore}
                disabled={visible >= results.length}
                className="h-11 gap-2"
              >
                <Plus className="size-4" />
                {visible >= results.length ? "No more videos" : "More"}
              </Button>
              <div className="text-2xs text-muted-foreground">
                Showing {Math.min(visible, results.length)} of {results.length}
              </div>
            </div>
          </>
        )}

        {!problem && !loading && (
          <div className="rounded-xl border border-dashed border-border/60 bg-surface/30 p-8 text-center text-sm text-muted-foreground">
            Enter a problem ID above to fetch a video walkthrough.
          </div>
        )}
      </div>

      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-4xl overflow-hidden border-border/60 bg-background/95 p-0 backdrop-blur-xl">
          <DialogTitle className="sr-only">{playing?.title ?? "Video player"}</DialogTitle>
          {playing && (
            <div className="flex flex-col animate-scale-in">
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  key={playing.videoId}
                  src={`https://www.youtube-nocookie.com/embed/${playing.videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={playing.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-semibold">{playing.title}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {playing.channel}
                    {playing.views ? ` · ${playing.views}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setPlaying(null)}
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
