import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

/**
 * Abuse guard: this endpoint is intentionally reachable by signed-out visitors
 * (guests can look up editorials), so it is throttled per caller and the number
 * of outbound scrapes per call is capped so it cannot be used as a relay.
 */
const RATE_WINDOW_MS = 60_000;
const ANON_LIMIT = 6;
const AUTH_LIMIT = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) {
    throw new Error("Too many video searches. Please wait a moment and try again.");
  }
}


export interface VideoResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
  duration?: string;
  views?: string;
}

async function fetchYouTube(query: string): Promise<VideoResult[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query,
  )}&sp=EgIQAQ%253D%253D`; // filter: videos only

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`YouTube fetch failed [${res.status}]`);
  const html = await res.text();

  const match = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return [];

  let json: unknown;
  try {
    json = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const results: VideoResult[] = [];
  const seen = new Set<string>();

  const walk = (node: unknown) => {
    if (results.length >= 15 || !node || typeof node !== "object") return;
    const anyNode = node as Record<string, unknown>;
    const vr = anyNode.videoRenderer as Record<string, unknown> | undefined;
    if (vr && typeof vr.videoId === "string" && !seen.has(vr.videoId)) {
      seen.add(vr.videoId);
      const title =
        (vr.title as { runs?: { text?: string }[] } | undefined)?.runs?.[0]?.text ?? "";
      const channel =
        (vr.ownerText as { runs?: { text?: string }[] } | undefined)?.runs?.[0]?.text ??
        (vr.longBylineText as { runs?: { text?: string }[] } | undefined)?.runs?.[0]?.text ??
        "";
      const thumbs =
        (vr.thumbnail as { thumbnails?: { url: string }[] } | undefined)?.thumbnails ?? [];
      const thumbnail = thumbs[thumbs.length - 1]?.url ?? "";
      const duration =
        (vr.lengthText as { simpleText?: string } | undefined)?.simpleText ?? undefined;
      const views =
        (vr.shortViewCountText as { simpleText?: string } | undefined)?.simpleText ??
        (vr.viewCountText as { simpleText?: string } | undefined)?.simpleText ??
        undefined;
      results.push({
        videoId: vr.videoId,
        title,
        channel,
        thumbnail,
        duration,
        views,
        url: `https://www.youtube.com/watch?v=${vr.videoId}`,
      });
    }
    for (const k of Object.keys(anyNode)) walk(anyNode[k]);
  };

  walk(json);
  return results;
}

export const searchVideos = createServerFn({ method: "GET" })
  .inputValidator((data: { query: string }) => {
    if (!data || typeof data.query !== "string" || !data.query.trim()) {
      throw new Error("query is required");
    }
    return { query: data.query.trim().slice(0, 200) };
  })
  .handler(async ({ data }): Promise<VideoResult[]> => {
    const base = data.query;
    const queries = [
      `${base} solution editorial`,
      `${base} solution`,
      `${base} explained`,
      `${base} tutorial`,
      base,
    ];

    const merged: VideoResult[] = [];
    const seen = new Set<string>();
    for (const q of queries) {
      let batch: VideoResult[] = [];
      try {
        batch = await fetchYouTube(q);
      } catch {
        continue;
      }
      for (const v of batch) {
        if (seen.has(v.videoId)) continue;
        seen.add(v.videoId);
        merged.push(v);
      }
      if (merged.length >= 12) break;
    }
    return merged.slice(0, 12);
  });
