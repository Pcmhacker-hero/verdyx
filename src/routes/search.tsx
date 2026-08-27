import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock,
  Compass,
  CornerDownLeft,
  FileText,
  Filter,
  History,
  ImagePlus,
  Layers,
  Lightbulb,
  Link2,
  Network,
  Paperclip,
  Search as SearchIcon,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wand2,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ds/kbd";
import { cn } from "@/lib/utils";
import { seededRandom } from "@/lib/rand";
import { useServerFn } from "@tanstack/react-start";
import { askMentor } from "@/lib/mentor.functions";
import { TypewriterMarkdown } from "@/components/app/mentor-markdown";
import { toast } from "sonner";

const rng = seededRandom(0x5ea4c);

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Ask Verdiqy · Global AI Search" },
      {
        name: "description",
        content:
          "Ask Verdiqy anything about competitive programming. Find rated problems, similar tasks, and clear explanations — in one place.",
      },
      { property: "og:title", content: "Ask Verdiqy · Global AI Search" },
      {
        property: "og:description",
        content:
          "Natural-language search across problems, topics, and top programmers — with beautiful, source-linked answers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

// ---------------- data ----------------

type Intent = "find-problems" | "similar" | "teach" | "by-author" | "explain" | "unknown";

interface ProblemHit {
  id: string;
  code: string;
  title: string;
  rating: number;
  tags: string[];
  author?: string;
  solved: number;
  match: number; // 0..1
  summary: string;
}

interface ConceptHit {
  id: string;
  title: string;
  category: string;
  prerequisites: string[];
  minutes: number;
  summary: string;
}

interface AuthorHit {
  handle: string;
  name: string;
  rating: number;
  known: string;
}

const PROBLEMS: ProblemHit[] = [
  {
    id: "p1",
    code: "1706D",
    title: "Chopping Carrots",
    rating: 1700,
    tags: ["graphs", "binary-search", "greedy"],
    solved: 8420,
    match: 0.94,
    summary:
      "Model the cut as edges over sorted values; binary search the answer and validate with a linear sweep.",
  },
  {
    id: "p2",
    code: "1725B",
    title: "Basketball Together",
    rating: 1700,
    tags: ["graphs", "greedy", "sortings"],
    solved: 12034,
    match: 0.9,
    summary: "Greedy grouping over sorted skills — treat teams as connected components of size k.",
  },
  {
    id: "p3",
    code: "1791G2",
    title: "Teleporters (Hard)",
    rating: 1750,
    tags: ["graphs", "dp", "sortings"],
    solved: 6210,
    match: 0.87,
    summary: "Two-pointer over sorted costs; think of it as shortest paths on a virtual DAG.",
  },
  {
    id: "p4",
    code: "1850E",
    title: "Cardboard for Pictures",
    rating: 1300,
    tags: ["binary-search", "math"],
    solved: 24501,
    match: 0.99,
    summary: "Monotonic predicate on frame width — classic binary search on the answer.",
  },
  {
    id: "p5",
    code: "1866F",
    title: "Higher Order Functions",
    rating: 1900,
    tags: ["dp", "graphs", "combinatorics"],
    author: "tourist",
    solved: 1802,
    match: 0.92,
    summary: "Multi-dimensional DP over a functional graph; watch out for the log factor.",
  },
  {
    id: "p6",
    code: "1748F",
    title: "Circular Xor Reversal",
    rating: 2400,
    tags: ["dp", "constructive", "bitmask"],
    author: "tourist",
    solved: 640,
    match: 0.88,
    summary: "Bitmask DP on the reversal structure. Tight constructive step at the end.",
  },
];

const CONCEPTS: Record<string, ConceptHit> = {
  "segment-tree": {
    id: "segment-tree",
    title: "Segment Tree",
    category: "Data structures",
    prerequisites: ["arrays", "recursion", "divide-and-conquer"],
    minutes: 22,
    summary:
      "A perfect binary tree over an array that answers associative range queries in O(log n) with O(n) build.",
  },
  dsu: {
    id: "union-find",
    title: "Disjoint Set Union (Union-Find)",
    category: "Data structures",
    prerequisites: ["arrays", "trees"],
    minutes: 14,
    summary:
      "Track connected components under union operations. With path compression + union by rank, both ops are effectively O(α(n)).",
  },
  dijkstra: {
    id: "dijkstra",
    title: "Dijkstra's Shortest Path",
    category: "Graphs",
    prerequisites: ["graphs", "heaps", "bfs"],
    minutes: 18,
    summary:
      "Greedy shortest paths from a single source on non-negative weights. O((n+m) log n) with a binary heap.",
  },
};

const AUTHORS: Record<string, AuthorHit> = {
  tourist: {
    handle: "tourist",
    name: "Gennady Korotkevich",
    rating: 3800,
    known: "Ad-hoc & constructive",
  },
  errichto: {
    handle: "errichto",
    name: "Kamil Debowski",
    rating: 2650,
    known: "Clear DP explanations",
  },
  benq: { handle: "benq", name: "Benjamin Qi", rating: 3200, known: "Curated roadmaps" },
};

const SUGGESTIONS = [
  "I need 1700-rated graph problems",
  "Show me problems similar to 1850E",
  "Teach me Segment Tree",
  "Show tourist's hardest DP problems",
  "Explain DSU",
];

const RECENT = [
  "Sparse table vs segment tree",
  "1600 constructive practice set",
  "Best editorials for flows",
];

// ---------------- intent parser ----------------

interface Parsed {
  intent: Intent;
  rating?: number;
  tags: string[];
  author?: string;
  similarTo?: string;
  concept?: string;
}

function parseQuery(raw: string): Parsed {
  const q = raw.toLowerCase().trim();
  const out: Parsed = { intent: "unknown", tags: [] };

  const ratingMatch = q.match(/(\d{3,4})[\s-]*(?:rated|rating|elo)?/);
  if (ratingMatch) {
    const n = Number(ratingMatch[1]);
    if (n >= 800 && n <= 3500) out.rating = n;
  }

  const knownTags = [
    "graph",
    "graphs",
    "dp",
    "greedy",
    "tree",
    "trees",
    "flow",
    "flows",
    "bitmask",
    "constructive",
    "math",
    "geometry",
    "string",
    "strings",
    "binary-search",
  ];
  for (const t of knownTags) if (q.includes(t)) out.tags.push(t.replace(/s$/, ""));

  const authorMatch = q.match(/(?:from|by|@)?\s*(tourist|errichto|benq|petr|neal|um_?nik)/);
  if (authorMatch) out.author = authorMatch[1].replace("_", "");

  const similar = q.match(/similar to\s+([0-9]{3,4}[a-z0-9]+)/);
  if (similar) out.similarTo = similar[1].toUpperCase();

  if (q.includes("teach") || q.includes("learn") || q.startsWith("how ") || q.startsWith("what ")) {
    out.intent = "teach";
  }
  if (q.startsWith("explain")) out.intent = "explain";

  if (q.includes("segment tree")) out.concept = "segment-tree";
  else if (q.includes("dsu") || q.includes("union find") || q.includes("union-find"))
    out.concept = "dsu";
  else if (q.includes("dijkstra")) out.concept = "dijkstra";

  if (out.similarTo) out.intent = "similar";
  else if (out.author) out.intent = "by-author";
  else if (out.concept && (out.intent === "teach" || out.intent === "explain")) {
    // keep
  } else if (out.concept) out.intent = "teach";
  else if (out.rating || out.tags.length) out.intent = "find-problems";

  return out;
}

interface AnswerResult {
  headline: string;
  body: string;
  problems: ProblemHit[];
  concept?: ConceptHit;
  author?: AuthorHit;
  related: string[];
  intent: Intent;
}

function answerFor(parsed: Parsed): AnswerResult {
  const related = [
    "Show me 2 harder variants",
    "What's the first insight?",
    "Give me a 15-minute study plan",
  ];

  if (parsed.intent === "similar" && parsed.similarTo) {
    const seed = PROBLEMS.find((p) => p.code === parsed.similarTo);
    const shared = seed?.tags ?? ["binary-search"];
    const results = PROBLEMS.filter(
      (p) => p.code !== parsed.similarTo && p.tags.some((t) => shared.includes(t)),
    )
      .slice(0, 4)
      .map((p) => ({ ...p, match: 0.75 + rng() * 0.2 }))
      .sort((a, b) => b.match - a.match);
    return {
      intent: parsed.intent,
      headline: `Problems similar to ${parsed.similarTo}`,
      body: seed
        ? `${parsed.similarTo} is a ${seed.rating}-rated ${seed.tags.slice(0, 2).join(" & ")} task. Below are ${results.length} problems that share its core mechanic — ranked by how closely the required insight matches.`
        : `I couldn't find ${parsed.similarTo} in the index, but here are the closest matches on tag overlap.`,
      problems: results,
      related,
    };
  }

  if (parsed.intent === "by-author" && parsed.author) {
    const author = AUTHORS[parsed.author];
    const wantDp = parsed.tags.includes("dp");
    const results = PROBLEMS.filter((p) => p.author === parsed.author)
      .filter((p) => (wantDp ? p.tags.includes("dp") : true))
      .sort((a, b) => b.rating - a.rating);
    return {
      intent: parsed.intent,
      headline: `${author?.name ?? parsed.author}'s ${wantDp ? "hardest DP" : "problems"}`,
      body: `Sorted by difficulty. ${author?.name ?? parsed.author} is known for ${author?.known.toLowerCase() ?? "sharp problem-setting"} — expect tight bounds and clean invariants.`,
      problems: results,
      author,
      related,
    };
  }

  if ((parsed.intent === "teach" || parsed.intent === "explain") && parsed.concept) {
    const c = CONCEPTS[parsed.concept];
    const rel = PROBLEMS.filter((p) => p.tags.some((t) => c.title.toLowerCase().includes(t))).slice(
      0,
      3,
    );
    return {
      intent: parsed.intent,
      headline: c.title,
      body: c.summary,
      problems: rel,
      concept: c,
      related: [
        `Show me 3 warm-up problems for ${c.title}`,
        `Common bugs in ${c.title}`,
        `${c.title} vs alternatives`,
      ],
    };
  }

  if (parsed.intent === "find-problems") {
    const results = PROBLEMS.filter((p) =>
      parsed.rating ? Math.abs(p.rating - parsed.rating) <= 200 : true,
    )
      .filter((p) => (parsed.tags.length ? p.tags.some((t) => parsed.tags.includes(t)) : true))
      .sort((a, b) =>
        parsed.rating
          ? Math.abs(a.rating - parsed.rating) - Math.abs(b.rating - parsed.rating)
          : b.match - a.match,
      )
      .slice(0, 5);
    const tagLabel = parsed.tags.length ? parsed.tags.join(" & ") : "any topic";
    const ratingLabel = parsed.rating ? `around ${parsed.rating}` : "across ratings";
    return {
      intent: parsed.intent,
      headline: `${results.length} ${tagLabel} problems ${ratingLabel}`,
      body: `Ranked by how close they are to your target. Each is picked so the core insight matches — no throwaway grinding.`,
      problems: results,
      related: [
        `Give me ${parsed.rating ? parsed.rating + 100 : 1800}-rated versions`,
        `Which of these teaches the most?`,
        `Turn this into a 3-day plan`,
      ],
    };
  }

  return {
    intent: "unknown",
    headline: "Ask Verdiqy anything",
    body: "Try a natural question — rated problem search, similar-to lookups, concept explanations, or an author's toughest tasks. Verdiqy parses intent and returns real matches with sources.",
    problems: [],
    related: SUGGESTIONS,
  };
}

// ---------------- page ----------------

function SearchPage() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<"checking" | "authed" | "guest">("checking");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        toast.error("Login required", {
          description: "Please sign in to use Ask Verdiqy.",
        });
        setAuthState("guest");
      } else {
        setAuthState("authed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const ask = useServerFn(askMentor);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [replyId, setReplyId] = useState<string>("");
  const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [files, setFiles] = useState<{ filename: string; dataUrl: string }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const parsed = useMemo(() => (submitted ? parseQuery(submitted) : null), [submitted]);
  const result = useMemo(() => (parsed ? answerFor(parsed) : null), [parsed]);

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const run = async (q: string) => {
    const clean = q.trim();
    const hasAttachments = images.length > 0 || files.length > 0;
    if (!clean && !hasAttachments) return;
    const prompt = clean || "Please review the attached file.";
    setQuery(clean);
    setSubmitted(prompt);
    setAiReply(null);
    setThinking(true);
    const attachedImages = images.map((i) => ({ dataUrl: i.dataUrl }));
    const attachedFiles = files.map((f) => ({ filename: f.filename, dataUrl: f.dataUrl }));
    try {
      const { reply } = await ask({
        data: {
          messages: [
            {
              role: "user",
              content: prompt,
              ...(attachedImages.length ? { images: attachedImages } : {}),
              ...(attachedFiles.length ? { files: attachedFiles } : {}),
            },
          ],
        },
      });
      setAiReply(reply);
      setReplyId(crypto.randomUUID());
    } catch (e) {
      toast.error((e as Error).message ?? "Verdiqy couldn't respond");
      setAiReply("Sorry — I couldn't reach Verdiqy just now. Please try again.");
      setReplyId(crypto.randomUUID());
    } finally {
      setThinking(false);
    }
  };

  const clear = () => {
    setQuery("");
    setSubmitted(null);
    setAiReply(null);
    setThinking(false);
    setImages([]);
    setFiles([]);
    inputRef.current?.focus();
  };

  if (authState !== "authed") {
    return (
      <AppShell breadcrumb={[{ label: "Ask Verdiqy" }]}>
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          {authState === "checking" ? "Checking your session…" : "Redirecting to sign in…"}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb={[{ label: "Ask Verdiqy" }]}>
      <div
        className={cn(
          "mx-auto w-full px-4 pb-16 md:px-8",
          submitted ? "max-w-[1120px] pt-6" : "max-w-3xl pt-16",
        )}
      >
        {!submitted ? <LandingIntro /> : null}

        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => run(query)}
          onClear={clear}
          submitted={!!submitted}
          inputRef={inputRef}
          images={images}
          files={files}
          onAddImages={(next) => setImages((prev) => [...prev, ...next].slice(0, 4))}
          onAddFiles={(next) => setFiles((prev) => [...prev, ...next].slice(0, 2))}
          onRemoveImage={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))}
          onRemoveFile={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
        />

        {!submitted ? (
          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_240px]">
            <SuggestionGrid onPick={run} />
            <RecentPanel items={RECENT} onPick={run} />
          </div>
        ) : (
          <ResultsView
            query={submitted}
            parsed={parsed!}
            result={result!}
            aiReply={aiReply}
            replyId={replyId}
            thinking={thinking}
            onFollowUp={run}
          />
        )}
      </div>
    </AppShell>
  );
}

// ---------------- landing ----------------

function LandingIntro() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-2xs font-medium text-muted-foreground backdrop-blur">
        <Sparkles className="size-3 text-primary" />
        Ask Verdiqy · natural language search
      </div>
      <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
        What do you want to master today?
      </h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground md:text-[15px]">
        Find rated problems, similar tasks, concept explanations, or a top coder's hardest sets —
        all in one line.
      </p>
    </div>
  );
}

// ---------------- search bar ----------------

type ImageAttachment = { name: string; dataUrl: string };
type FileAttachment = { filename: string; dataUrl: string };

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // ~4 MB
const MAX_FILE_BYTES = 8 * 1024 * 1024; // ~8 MB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  submitted,
  inputRef,
  images,
  files,
  onAddImages,
  onAddFiles,
  onRemoveImage,
  onRemoveFile,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  submitted: boolean;
  inputRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  images: ImageAttachment[];
  files: FileAttachment[];
  onAddImages: (next: ImageAttachment[]) => void;
  onAddFiles: (next: FileAttachment[]) => void;
  onRemoveImage: (i: number) => void;
  onRemoveFile: (i: number) => void;
}) {
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const hasAttachments = images.length > 0 || files.length > 0;
  const canSubmit = value.trim().length > 0 || hasAttachments;

  const handleImages = async (fileList: FileList | null) => {
    if (!fileList) return;
    const picks: ImageAttachment[] = [];
    for (const f of Array.from(fileList).slice(0, 4)) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name} is over 4 MB`);
        continue;
      }
      try {
        picks.push({ name: f.name, dataUrl: await readAsDataUrl(f) });
      } catch {
        toast.error(`Couldn't read ${f.name}`);
      }
    }
    if (picks.length) onAddImages(picks);
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const picks: FileAttachment[] = [];
    for (const f of Array.from(fileList).slice(0, 2)) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        toast.error(`${f.name} isn't a PDF`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`${f.name} is over 8 MB`);
        continue;
      }
      try {
        picks.push({ filename: f.name, dataUrl: await readAsDataUrl(f) });
      } catch {
        toast.error(`Couldn't read ${f.name}`);
      }
    }
    if (picks.length) onAddFiles(picks);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  return (
    <div className="group relative rounded-2xl border border-border/70 bg-background/80 shadow-[0_1px_0_color-mix(in oklab, var(--border) 70%, transparent),0_20px_60px_-30px_color-mix(in oklab, var(--primary) 35%, transparent)] transition-shadow focus-within:border-primary/40 focus-within:shadow-[0_1px_0_color-mix(in oklab, var(--primary) 40%, transparent),0_30px_80px_-30px_color-mix(in oklab, var(--primary) 50%, transparent)]">
      <div className="flex items-start gap-3 p-3 md:p-4">
        <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            rows={1}
            placeholder="Ask anything — attach an image or PDF for context"
            className="min-h-[2.25rem] w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none placeholder:text-muted-foreground/60"
          />
          {hasAttachments ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {images.map((img, i) => (
                <li
                  key={`img-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 py-1 pl-1 pr-1.5 text-2xs"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="size-6 rounded object-cover"
                  />
                  <span className="max-w-[9rem] truncate">{img.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(i)}
                    aria-label={`Remove ${img.name}`}
                    className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
              {files.map((f, i) => (
                <li
                  key={`file-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 py-1 pl-1.5 pr-1.5 text-2xs"
                >
                  <FileText className="size-3.5 text-primary" />
                  <span className="max-w-[9rem] truncate">{f.filename}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(i)}
                    aria-label={`Remove ${f.filename}`}
                    className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          {value || hasAttachments ? (
            <button
              onClick={onClear}
              aria-label="Clear"
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          <Button size="sm" onClick={onSubmit} disabled={!canSubmit} className="h-8 gap-1.5">
            {submitted ? "Ask again" : "Ask Verdiqy"}
            <CornerDownLeft className="size-3" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-2 text-2xs text-muted-foreground">
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleImages(e.target.files)}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => imgInputRef.current?.click()}
          disabled={images.length >= 4}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-border/70 bg-background px-2 transition-colors hover:bg-surface-muted disabled:opacity-40"
        >
          <ImagePlus className="size-3" /> Image
        </button>
        <button
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          disabled={files.length >= 2}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-border/70 bg-background px-2 transition-colors hover:bg-surface-muted disabled:opacity-40"
        >
          <Paperclip className="size-3" /> PDF
        </button>
        <span className="inline-flex items-center gap-1">
          <Kbd>↵</Kbd> to ask
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd>⇧</Kbd>
          <Kbd>↵</Kbd> newline
        </span>
        <span className="ml-auto inline-flex items-center gap-1">
          <Filter className="size-3" /> Rating, tags & authors detected
        </span>
      </div>
    </div>
  );
}


// ---------------- suggestions / recent ----------------

const SUGGESTION_META: { q: string; icon: typeof SearchIcon; tone: string; hint: string }[] = [
  {
    q: "I need 1700-rated graph problems",
    icon: Compass,
    tone: "text-indigo-500",
    hint: "Rated problem finder",
  },
  {
    q: "Show me problems similar to 1850E",
    icon: Link2,
    tone: "text-emerald-500",
    hint: "Similar-to lookup",
  },
  {
    q: "Teach me Segment Tree",
    icon: BookOpen,
    tone: "text-amber-500",
    hint: "Concept walkthrough",
  },
  {
    q: "Show tourist's hardest DP problems",
    icon: Users,
    tone: "text-rose-500",
    hint: "By author",
  },
  { q: "Explain DSU", icon: Lightbulb, tone: "text-sky-500", hint: "Quick explanation" },
];

function SuggestionGrid({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div>
      <p className="mb-2 px-1 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        Try asking
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SUGGESTION_META.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.q}>
              <button
                onClick={() => onPick(s.q)}
                className="group flex w-full items-start gap-3 rounded-xl border border-border/70 bg-background p-3 text-left transition-all hover:border-primary/40 hover:bg-surface-muted/40"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-muted",
                    s.tone,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.q}</span>
                  <span className="mt-0.5 block text-2xs text-muted-foreground">{s.hint}</span>
                </span>
                <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RecentPanel({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  return (
    <aside>
      <p className="mb-2 flex items-center gap-1.5 px-1 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        <History className="size-3" /> Recent
      </p>
      <ul className="space-y-1">
        {items.map((r) => (
          <li key={r}>
            <button
              onClick={() => onPick(r)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <Clock className="size-3 shrink-0" />
              <span className="truncate">{r}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ---------------- results view ----------------

function ResultsView({
  query,
  parsed,
  result,
  aiReply,
  replyId,
  thinking,
  onFollowUp,
}: {
  query: string;
  parsed: Parsed;
  result: AnswerResult;
  aiReply: string | null;
  replyId: string;
  thinking: boolean;
  onFollowUp: (q: string) => void;
}) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-6">
        <QueryHeader query={query} parsed={parsed} />

        <AnswerCard
          headline={result.headline}
          aiReply={aiReply}
          replyId={replyId}
          thinking={thinking}
          intent={result.intent}
        />

        {result.concept ? <ConceptCard concept={result.concept} /> : null}

        {result.problems.length > 0 ? (
          <section>
            <SectionLabel icon={Target}>
              Matched problems
              <Badge
                variant="secondary"
                className="ml-2 h-4 border-0 bg-surface-muted px-1.5 font-mono text-2xs"
              >
                {result.problems.length}
              </Badge>
            </SectionLabel>
            <ul className="mt-2 space-y-2">
              {result.problems.map((p) => (
                <ProblemCard key={p.id} problem={p} showMatch={result.intent === "similar"} />
              ))}
            </ul>
          </section>
        ) : null}

        <RelatedList items={result.related} onPick={onFollowUp} />
      </div>

      <ContextRail parsed={parsed} result={result} />
    </div>
  );
}

function QueryHeader({ query, parsed }: { query: string; parsed: Parsed }) {
  const chips: { label: string; tone: string }[] = [];
  if (parsed.rating) chips.push({ label: `~${parsed.rating}`, tone: "bg-primary/10 text-primary" });
  parsed.tags.forEach((t) =>
    chips.push({ label: `#${t}`, tone: "bg-surface-muted text-foreground/80" }),
  );
  if (parsed.author)
    chips.push({ label: `@${parsed.author}`, tone: "bg-rose-500/10 text-rose-500" });
  if (parsed.similarTo)
    chips.push({ label: `~ ${parsed.similarTo}`, tone: "bg-emerald-500/10 text-emerald-500" });
  if (parsed.concept)
    chips.push({
      label: `concept: ${parsed.concept}`,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    });

  return (
    <header>
      <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        You asked
      </p>
      <h2 className="mt-1 text-balance text-xl font-semibold tracking-tight md:text-2xl">
        {query}
      </h2>
      {chips.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <span key={i} className={cn("rounded-full px-2 py-0.5 font-mono text-2xs", c.tone)}>
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}

function AnswerCard({
  headline,
  aiReply,
  replyId,
  thinking,
  intent,
}: {
  headline: string;
  aiReply: string | null;
  replyId: string;
  thinking: boolean;
  intent: Intent;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-surface-muted/40 via-background to-background p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-2xs font-medium text-primary">
            <Sparkles className="size-3" /> Verdiqy answer
          </span>
          <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            intent · {intent.replace("-", " ")}
          </span>
        </div>
        <h3 className="text-lg font-semibold tracking-tight md:text-xl">{headline}</h3>
        <div className="mt-3 min-h-[3rem] text-sm leading-relaxed text-foreground/85 md:text-[15px]">
          {thinking || !aiReply ? (
            <ThinkingDots />
          ) : (
            <TypewriterMarkdown id={replyId} content={aiReply} />
          )}
        </div>
      </div>
    </article>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
      <span className="ml-2 font-mono text-2xs uppercase tracking-[0.14em]">thinking</span>
    </span>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: typeof Target; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
      <Icon className="size-3" />
      {children}
    </div>
  );
}

function ProblemCard({ problem, showMatch }: { problem: ProblemHit; showMatch?: boolean }) {
  const ratingTone =
    problem.rating < 1400
      ? "text-emerald-500"
      : problem.rating < 1900
        ? "text-sky-500"
        : problem.rating < 2400
          ? "text-amber-500"
          : "text-rose-500";
  return (
    <li>
      <a
        href="#"
        className="group flex items-start gap-4 rounded-xl border border-border/70 bg-background p-4 outline-none transition-all hover:border-primary/40 hover:bg-surface-muted/30 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex w-14 shrink-0 flex-col items-center">
          <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            CF
          </span>
          <span className="font-mono text-xs font-medium">{problem.code}</span>
          <span className={cn("mt-1 font-mono text-2xs font-medium", ratingTone)}>
            {problem.rating}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h4 className="min-w-0 flex-1 truncate text-sm font-semibold group-hover:text-primary">
              {problem.title}
            </h4>
            {showMatch ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-mono text-2xs font-medium text-emerald-500">
                <TrendingUp className="size-2.5" />
                {Math.round(problem.match * 100)}%
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {problem.summary}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {problem.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full bg-surface-muted/70 px-2 py-0.5 font-mono text-2xs text-muted-foreground"
              >
                #{t}
              </span>
            ))}
            <span className="ml-auto font-mono text-2xs text-muted-foreground/70">
              {problem.solved.toLocaleString()} solved
            </span>
          </div>
        </div>
        <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </a>
    </li>
  );
}

function ConceptCard({ concept }: { concept: ConceptHit }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-background p-5">
      <SectionLabel icon={BookOpen}>Concept</SectionLabel>
      <div className="mt-2 flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300">
          <Layers className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-base font-semibold tracking-tight">{concept.title}</h3>
            <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              {concept.category}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{concept.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-2xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> ~{concept.minutes} min read
            </span>
            <span className="inline-flex items-center gap-1">
              <Network className="size-3" />
              needs: {concept.prerequisites.join(" · ")}
            </span>
            <Button asChild size="sm" variant="ghost" className="ml-auto h-7 gap-1 text-xs">
              <Link to="/cheatsheets" hash={concept.id}>
                Open cheat sheet <ArrowUpRight className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RelatedList({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  return (
    <section>
      <SectionLabel icon={Wand2}>Ask a follow-up</SectionLabel>
      <ul className="mt-2 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-background">
        {items.map((r) => (
          <li key={r}>
            <button
              onClick={() => onPick(r)}
              className="group flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted/50"
            >
              <Sparkles className="size-3.5 text-primary/70" />
              <span className="min-w-0 flex-1 truncate">{r}</span>
              <ArrowRight className="size-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------- context rail ----------------

function ContextRail({ parsed, result }: { parsed: Parsed; result: AnswerResult }) {
  const sources: { title: string; hint: string; hash?: string }[] = [];
  if (result.problems.length) {
    sources.push({ title: "Codeforces problem index", hint: `${result.problems.length} matches` });
  }
  if (result.concept)
    sources.push({ title: "Verdiqy cheat sheet", hint: result.concept.title, hash: result.concept.id });
  if (parsed.author)
    sources.push({ title: `@${parsed.author} · public submissions`, hint: "sorted by rating" });
  if (sources.length === 0)
    sources.push({ title: "Verdiqy knowledge graph", hint: "no external calls" });

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-4">
        <section className="rounded-xl border border-border/70 bg-background p-4">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Sources
          </p>
          <ul className="mt-2 space-y-2">
            {sources.map((s, i) => (
              <li key={i}>
                <SourceItem index={i + 1} source={s} />
              </li>
            ))}
          </ul>
        </section>

        {result.author ? (
          <section className="rounded-xl border border-border/70 bg-background p-4">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              About the author
            </p>
            <p className="mt-2 text-sm font-semibold">{result.author.name}</p>
            <p className="text-2xs text-muted-foreground">
              @{result.author.handle} · {result.author.rating} · {result.author.known}
            </p>
          </section>
        ) : null}

        <section className="rounded-xl border border-dashed border-border/70 p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Verdiqy parses your question locally, then routes to problems, concepts, or authors — no
            wasted round-trips.
          </p>
        </section>
      </div>
    </aside>
  );
}

function SourceItem({
  index,
  source,
}: {
  index: number;
  source: { title: string; hint: string; hash?: string };
}) {
  const content = (
    <>
      <span className="mt-1 grid size-5 shrink-0 place-items-center rounded bg-primary/10 font-mono text-2xs font-medium text-primary">
        {index}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-xs font-medium">{source.title}</p>
        <p className="truncate text-2xs text-muted-foreground">{source.hint}</p>
      </div>
    </>
  );

  if (source.hash) {
    return (
      <Link
        to="/cheatsheets"
        hash={source.hash}
        className="group -m-1.5 flex items-start gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-muted/70"
      >
        {content}
        <ArrowUpRight className="mt-1 size-3 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
      </Link>
    );
  }

  return <div className="-m-1.5 flex items-start gap-2 p-1.5">{content}</div>;
}
