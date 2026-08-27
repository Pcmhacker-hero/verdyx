import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, PlayCircle, Youtube } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { searchVideos, type VideoResult } from "@/lib/videos.functions";
import { CFSolutionBadge } from "./cf-solution-badge";

const CACHE_KEY = "verdiqy.video-solutions.v1";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  problemKey: string;
  problemName: string;
  contestLabel: string;
}

export function VideoSolutionsDialog({
  open,
  onOpenChange,
  problemKey,
  problemName,
  contestLabel,
}: Props) {
  const search = useServerFn(searchVideos);
  const [results, setResults] = useState<VideoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const cache = readCache();
    const hit = cache[problemKey];
    if (hit && Date.now() - hit.cachedAt < CACHE_TTL && hit.results.length > 0) {
      setResults(hit.results);
      setFromCache(true);
      return;
    }
    setFromCache(false);
    setResults(null);
    setLoading(true);
    const q = `Codeforces ${contestLabel} ${problemName}`;
    search({ data: { query: q } })
      .then((r) => {
        setResults(r);
        const next = readCache();
        next[problemKey] = { results: r, cachedAt: Date.now() };
        writeCache(next);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch videos");
      })
      .finally(() => setLoading(false));
  }, [open, problemKey, problemName, contestLabel, search]);

  const refresh = () => {
    const cache = readCache();
    delete cache[problemKey];
    writeCache(cache);
    setResults(null);
    setFromCache(false);
    setLoading(true);
    setError(null);
    const q = `Codeforces ${contestLabel} ${problemName}`;
    search({ data: { query: q } })
      .then((r) => {
        setResults(r);
        const next = readCache();
        next[problemKey] = { results: r, cachedAt: Date.now() };
        writeCache(next);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to fetch videos"))
      .finally(() => setLoading(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="size-5 text-red-500" />
            Video Solutions
          </DialogTitle>
          <DialogDescription className="truncate">
            {problemName} <span className="text-muted-foreground">· {contestLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching YouTube for the best walkthroughs…
            </div>
          )}
          {error && !loading && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && results && results.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No videos found. Try opening the problem on Codeforces directly.
            </div>
          )}
          {!loading && results && results.length > 0 && (
            <ul className="space-y-2">
              {results.map((v) => (
                <li key={v.videoId}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex gap-3 rounded-xl border border-border/60 bg-surface/40 p-2 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {v.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground">
                          <PlayCircle className="size-8" />
                        </div>
                      )}
                      {v.duration && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                          {v.duration}
                        </span>
                      )}
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
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-3 text-2xs text-muted-foreground">
          <span>
            {fromCache ? "Loaded from cache" : results ? "Fresh results" : ""}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={refresh}
            disabled={loading}
            className="h-7 text-xs"
          >
            Refresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
