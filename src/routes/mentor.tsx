import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { askMentor } from "@/lib/mentor.functions";
import { supabase } from "@/integrations/supabase/client";
import { TypewriterMarkdown } from "@/components/app/mentor-markdown";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleDot,
  Command,
  Flag,
  Flame,
  GitBranch,
  Lightbulb,
  LineChart as LineChartIcon,
  Loader2,
  Lock,
  MessageSquare,
  Minus,
  Pause,
  Play,
  Send,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
  ImagePlus,
  Trash2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Kbd } from "@/components/ds/kbd";
import { StatusDot } from "@/components/ds/status-dot";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mentor")({
  head: () => ({
    meta: [
      { title: "Mentor · Verdiqy" },
      {
        name: "description",
        content:
          "A private competitive programming coach that reads your practice history and gives you the next specific move.",
      },
    ],
  }),
  component: MentorPage,
});

// ---------- Data ----------

const ratingSeries = [
  { d: "W-11", rating: 1612, target: 1900 },
  { d: "W-10", rating: 1638, target: 1900 },
  { d: "W-9", rating: 1655, target: 1900 },
  { d: "W-8", rating: 1671, target: 1900 },
  { d: "W-7", rating: 1690, target: 1900 },
  { d: "W-6", rating: 1704, target: 1900 },
  { d: "W-5", rating: 1712, target: 1900 },
  { d: "W-4", rating: 1728, target: 1900 },
  { d: "W-3", rating: 1741, target: 1900 },
  { d: "W-2", rating: 1747, target: 1900 },
  { d: "W-1", rating: 1758, target: 1900 },
  { d: "Now", rating: 1764, target: 1900 },
];

const binarySearchTrend = [
  { d: "M1", acc: 62 },
  { d: "M2", acc: 66 },
  { d: "M3", acc: 68 },
  { d: "M4", acc: 67 },
  { d: "M5", acc: 68 },
  { d: "M6", acc: 66 },
];

const binarySearchTemplateText = `Pinned binary search template:

\`\`\`cpp
int lo = 0, hi = n; // answer is in [lo, hi]
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (ok(mid)) hi = mid;
    else lo = mid + 1;
}
// lo is the first position where ok(x) is true
\`\`\`

Before coding, write these three lines above your solution:
1. What is monotonic?
2. What does ok(x) mean?
3. Am I finding first true or last false?`;

const binarySearchProblemQueueText = `Queued 5 binary search problems:

1. 474B · Worms — prefix sums + first true
2. 706B · Interesting drink — upper_bound basics
3. 1201C · Maximum Median — binary search on answer
4. 371C · Hamburgers — feasibility check
5. 1370D · Odd-Even Subsequence — monotonic predicate

Use the pinned template for every one. Time-box each attempt to 25 minutes before checking hints.`;

const binarySearchLossesText = `Where you lost time on binary search (last 6 months):

- 1547E · Air Conditioners — 14 min lost to off-by-one on the "last false" boundary
- 1385D · a-Good String — 11 min re-deriving mid update (used lo = mid instead of lo = mid + 1)
- 1354D · Multiset — 9 min on inclusive vs exclusive hi
- 1201C · Maximum Median — 8 min second-guessing the predicate direction
- 706B · Interesting drink — 6 min switching between lower_bound and upper_bound

Pattern: ~48 min/month bled on boundary edits, not on ideas. The pinned template kills ~80% of this.`;

type Problem = {
  id: string;
  title: string;
  rating: number;
  tag: string;
  minutes: number;
  status: "queued" | "recommended" | "stretch";
};

const graphPlan: Problem[] = [
  {
    id: "1547E",
    title: "Air Conditioners",
    rating: 1800,
    tag: "multi-source BFS",
    minutes: 35,
    status: "recommended",
  },
  {
    id: "1611E1",
    title: "Escape The Maze (easy)",
    rating: 1700,
    tag: "BFS on grid",
    minutes: 30,
    status: "recommended",
  },
  {
    id: "1594D",
    title: "The Number of Imposters",
    rating: 1700,
    tag: "bipartite / DSU",
    minutes: 40,
    status: "queued",
  },
  {
    id: "1660F1",
    title: "Promising String (easy)",
    rating: 1750,
    tag: "shortest paths",
    minutes: 45,
    status: "queued",
  },
  {
    id: "1520G",
    title: "To Go Or Not To Go?",
    rating: 2200,
    tag: "0-1 BFS",
    minutes: 60,
    status: "stretch",
  },
];

const timeline = [
  {
    when: "Mon",
    kind: "focus",
    title: "Foundations: BFS on grids",
    detail: "2 warm-ups + 1 rated (1500–1700). Target 45 min.",
    tone: "primary" as const,
  },
  {
    when: "Tue",
    kind: "focus",
    title: "Multi-source BFS",
    detail: "Rewrite 1520B from memory. Then attempt 1547E cold.",
    tone: "primary" as const,
  },
  {
    when: "Wed",
    kind: "review",
    title: "Editorial deep-dive",
    detail: "Read your 3 failed submissions from last week. Journal one insight each.",
    tone: "muted" as const,
  },
  {
    when: "Thu",
    kind: "stretch",
    title: "0-1 BFS + Dijkstra bridge",
    detail: "One 2000-rated problem. Time-box to 60 min. It's okay to peek.",
    tone: "warning" as const,
  },
  {
    when: "Fri",
    kind: "contest",
    title: "Virtual: Round 812 (Div. 2)",
    detail: "Full contest window. No editorial until you submit A–D.",
    tone: "danger" as const,
  },
  {
    when: "Sat",
    kind: "rest",
    title: "Recovery day",
    detail: "Optional: watch Errichto's DSU stream. No solving.",
    tone: "muted" as const,
  },
  {
    when: "Sun",
    kind: "review",
    title: "Weekly retro with Verdiqy",
    detail: "I'll draft the retro. You approve or push back.",
    tone: "primary" as const,
  },
];

// ---------- Chat state ----------

type ChatImage = { dataUrl: string };
type ChatMessage = { role: "user" | "assistant"; content: string; id: string; images?: ChatImage[] };
type MentorConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updated_at: string;
};

type ChatCtx = {
  messages: ChatMessage[];
  send: (text: string, images?: ChatImage[]) => Promise<void>;
  addAssistant: (text: string) => void;
  reset: () => void;
  history: MentorConversation[];
  historyOpen: boolean;
  historyLoading: boolean;
  openHistory: () => Promise<void>;
  setHistoryOpen: (open: boolean) => void;
  loadConversation: (conversation: MentorConversation) => void;
  deleteConversation: (id: string) => Promise<void>;
  pending: boolean;
  showDemo: boolean;
  draft: string;
  setDraft: (v: string) => void;
};

const ChatContext = createContext<ChatCtx | null>(null);
const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("ChatContext missing");
  return ctx;
};

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is { role: "user" | "assistant"; content: string; id?: string } =>
        m != null &&
        typeof m === "object" &&
        ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
        typeof (m as { content?: unknown }).content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content, id: m.id ?? crypto.randomUUID() }));
}

function conversationTitle(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((m) => m.role === "user")?.content;
  const source = firstUserMessage || messages[0]?.content || "Mentor briefing";
  return source.length > 54 ? `${source.slice(0, 54)}…` : source;
}

function ChatProvider({ children }: { children: ReactNode }) {
  const ask = useServerFn(askMentor);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<MentorConversation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [draft, setDraft] = useState("");

  const refreshHistory = async (openWhenDone = false) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      toast.error("Sign in to view synced mentor history");
      navigate({ to: "/auth", search: { next: "/mentor" } });
      return;
    }

    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("mentor_conversations")
        .select("id, title, messages, updated_at")
        .eq("user_id", userData.user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setHistory(
        (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          messages: normalizeMessages(row.messages),
          updated_at: row.updated_at,
        })),
      );
      if (openWhenDone) setHistoryOpen(true);
    } catch (e) {
      toast.error((e as Error).message ?? "Couldn't load mentor history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveConversation = async (nextMessages: ChatMessage[]) => {
    if (nextMessages.length === 0) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const payload = nextMessages.map(({ role, content, id }) => ({ role, content, id }));
    const title = conversationTitle(nextMessages);

    try {
      if (activeConversationId) {
        const { error } = await supabase
          .from("mentor_conversations")
          .update({ title, messages: payload })
          .eq("id", activeConversationId)
          .eq("user_id", userData.user.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("mentor_conversations")
          .insert({ user_id: userData.user.id, title, messages: payload })
          .select("id")
          .single();
        if (error) throw error;
        setActiveConversationId(data.id);
      }
      await refreshHistory(false);
    } catch (e) {
      toast.error((e as Error).message ?? "Couldn't sync mentor history");
    }
  };

  const addAssistant = (text: string) => {
    const assistantMsg: ChatMessage = { role: "assistant", content: text, id: crypto.randomUUID() };
    setMessages((cur) => {
      const next = [...cur, assistantMsg];
      void saveConversation(next);
      return next;
    });
  };

  const send = async (text: string, images?: ChatImage[]) => {
    const clean = text.trim();
    if ((!clean && !images?.length) || pending) return;
    const userMsg: ChatMessage = {
      role: "user",
      content: clean || (images?.length ? "(image attached)" : ""),
      id: crypto.randomUUID(),
      images,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setPending(true);
    try {
      const { reply } = await ask({
        data: {
          messages: next.map(({ role, content, images }) => ({
            role,
            content,
            ...(images && images.length ? { images } : {}),
          })),
        },
      });
      const assistantMsg: ChatMessage = { role: "assistant", content: reply, id: crypto.randomUUID() };
      setMessages((cur) => [...cur, assistantMsg]);
      await saveConversation([...next, assistantMsg]);
    } catch (e) {
      toast.error((e as Error).message ?? "Mentor couldn't respond");
      // Roll back the user's message so they can retry from the composer.
      setMessages((cur) => cur.filter((m) => m.id !== userMsg.id));
    } finally {
      setPending(false);
    }
  };

  const loadConversation = (conversation: MentorConversation) => {
    setMessages(conversation.messages);
    setActiveConversationId(conversation.id);
    setShowDemo(false);
    setHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Mentor history loaded");
  };

  const reset = () => {
    setMessages([]);
    setActiveConversationId(null);
    setShowDemo(false);
  };

  const deleteConversation = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Sign in to manage mentor history");
      return;
    }
    const prev = history;
    setHistory((h) => h.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setMessages([]);
      setActiveConversationId(null);
    }
    try {
      const { error } = await supabase
        .from("mentor_conversations")
        .delete()
        .eq("id", id)
        .eq("user_id", userData.user.id);
      if (error) throw error;
      toast.success("Conversation deleted");
    } catch (e) {
      setHistory(prev);
      toast.error((e as Error).message ?? "Couldn't delete conversation");
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        send,
        addAssistant,
        reset,
        history,
        historyOpen,
        historyLoading,
        openHistory: () => refreshHistory(true),
        setHistoryOpen,
        loadConversation,
        deleteConversation,
        pending,
        showDemo,
        draft,
        setDraft,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// ---------- Page ----------

function MentorPage() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<"checking" | "authed" | "guest">("checking");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        toast.error("Login required", {
          description: "Please sign in to use the Mentor.",
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

  if (authState !== "authed") {
    return (
      <AppShell breadcrumb={[{ label: "Mentor" }]}>
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          {authState === "checking" ? "Checking your session…" : "Redirecting to sign in…"}
        </div>
      </AppShell>
    );
  }

  return (
    <ChatProvider>
      <MentorPageInner />
    </ChatProvider>
  );
}


function MentorPageInner() {
  const { reset, openHistory, send, pending } = useChat();
  const sentRef = useRef(false);
  useEffect(() => {
    if (sentRef.current || pending) return;
    try {
      const prompt = sessionStorage.getItem("verdiqy.mentor.pending-prompt");
      if (prompt) {
        sessionStorage.removeItem("verdiqy.mentor.pending-prompt");
        sentRef.current = true;
        void send(prompt);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <AppShell
      breadcrumb={[{ label: "Mentor" }]}
      actions={
        <>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={openHistory}>
            <MessageSquare className="size-3.5" />
            History
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => {
              reset();
              window.scrollTo({ top: 0, behavior: "smooth" });
              toast.success("New chat started");
            }}
          >
            <Sparkles className="size-3.5" />
            New chat
          </Button>
        </>
      }
    >
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <MentorHeader />
        <Conversation />
        <Composer />
      </div>
      <HistorySheet />
    </AppShell>
  );
}

function HistorySheet() {
  const { history, historyOpen, historyLoading, setHistoryOpen, loadConversation, deleteConversation } = useChat();
  return (
    <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/70 px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-primary" />
            Mentor history
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {historyLoading ? (
            <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading synced history…
            </div>
          ) : history.length === 0 ? (
            <div className="px-2 py-6 text-sm text-muted-foreground">
              No saved mentor conversations for this account yet.
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((conversation) => (
                <div
                  key={conversation.id}
                  className="group flex items-center gap-1 rounded-md pr-1 transition-colors hover:bg-surface-muted focus-within:bg-surface-muted"
                >
                  <button
                    type="button"
                    onClick={() => loadConversation(conversation)}
                    className="min-w-0 flex-1 rounded-md px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block truncate text-sm font-medium text-foreground">
                      {conversation.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {conversation.messages.length} messages · {new Date(conversation.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${conversation.title}"? This can't be undone.`)) {
                        void deleteConversation(conversation.id);
                      }
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                    aria-label={`Delete conversation ${conversation.title}`}
                    title="Delete conversation"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------- Header ----------

function MentorHeader() {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border/70 pb-6">
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm">
            <Sparkles className="size-4" strokeWidth={2.4} />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-background">
            <StatusDot tone="success" />
          </span>
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight">Verdiqy</h1>
            <Badge
              variant="secondary"
              className="h-4 border-0 bg-primary/10 px-1.5 font-mono text-2xs font-medium text-primary"
            >
              MENTOR
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Reading 342 submissions · 14 contests · last synced 2m ago
          </p>
        </div>
      </div>
      <div className="hidden items-center gap-1 text-2xs text-muted-foreground sm:flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <span className="ml-1">to ask anything</span>
      </div>
    </div>
  );
}

// ---------- Welcome Hero ----------

function WelcomeHero() {
  const user = useCurrentUser();
  const { draft } = useChat();
  const firstName = (user?.name ?? "").split(/\s+/)[0] || "there";
  const hasDraft = draft.trim().length > 0;
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent ring-1 ring-primary/20">
          <Sparkles className="size-6 text-primary" strokeWidth={2.2} />
        </div>
        <Link
          to="/settings/profile"
          aria-label="Open profile settings"
          className="group relative rounded-full outline-none ring-offset-background transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Avatar className="size-14 ring-1 ring-border shadow-sm transition-shadow group-hover:shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-semibold text-primary">
              {user?.initials ?? "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
        Welcome,{" "}
        <span className="bg-gradient-to-br from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
          {firstName}
        </span>
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground md:text-base">
        How can I help you today? Ask about a problem, a contest, or your next
        training plan.
      </p>
      <div
        aria-hidden={hasDraft}
        className={`mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-all duration-300 ${
          hasDraft ? "pointer-events-none translate-y-1 opacity-0" : "opacity-100"
        }`}
      >
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        Start typing to send a message
      </div>
    </div>
  );
}

// ---------- Conversation ----------


function Conversation() {
  const { showDemo } = useChat();
  return (
    <div className="flex flex-col gap-8">
      {showDemo ? (
      <>
      
      <MentorTurn timestamp="Today · 09:12">
        <Prose>
          Morning, Alex. I looked at your last 30 days. You&apos;re{" "}
          <strong className="font-medium text-foreground">plateaued on Binary Search</strong> and
          your <strong className="font-medium text-foreground">Graph Theory acceptance</strong> is
          quietly climbing. Here&apos;s what I think we should do this week.
        </Prose>

        <VerdictCard />

        <Prose>
          The <em>why</em>: your rating gain in the last 6 weeks is entirely from ad-hoc and greedy.
          That&apos;s a fragile base for Candidate Master. Graphs are the shortest path to a real
          ceiling raise.
        </Prose>

        <RatingCard />
      </MentorTurn>

      <UserTurn>Okay — what specifically should I do this week?</UserTurn>

      <MentorTurn timestamp="Today · 09:12">
        <Prose>
          A concrete 7-day plan. It&apos;s tuned to your evening schedule (avg 68 min/session) and
          leaves Saturday for rest — you skipped 4 of the last 5, so I&apos;m making it official.
        </Prose>

        <WeekPlan />

        <Prose>
          Before you touch a graph problem though —{" "}
          <strong className="font-medium text-foreground">
            avoid 1800-rated DP problems until you finish these 12
          </strong>
          . You&apos;ve been guessing transitions instead of deriving them. That habit will calcify.
        </Prose>

        <PrerequisiteCard />
      </MentorTurn>

      <UserTurn>Why is my Binary Search stuck?</UserTurn>

      <MentorTurn timestamp="Today · 09:13">
        <Prose>
          Not a knowledge gap — a{" "}
          <strong className="font-medium text-foreground">templating gap</strong>. You re-derive the
          invariant every time. Your first-submission accuracy hasn&apos;t moved in six months:
        </Prose>

        <BinarySearchCard />

        <Prose>
          Fix: memorize one canonical template (I&apos;ll pin it), then solve 5 problems where you{" "}
          <em>must</em> use it. After that, you&apos;ll stop losing 8 minutes per problem to
          off-by-one edits.
        </Prose>

        <ActionRow
          primary={{ label: "Pin the template", icon: BookOpen }}
          secondary={[
            { label: "Queue 5 problems", icon: Target },
            { label: "Show me the losses", icon: LineChartIcon },
          ]}
        />
      </MentorTurn>

      <UserTurn>Am I ready for Candidate Master?</UserTurn>

      <MentorTurn timestamp="Today · 09:13">
        <Prose>
          Honestly? <strong className="font-medium text-foreground">Not this month.</strong> You
          could get lucky in one round, but your unlucky-round floor is 1680. That&apos;s the number
          that matters.
        </Prose>

        <ReadinessCard />

        <Prose>
          Two things need to land before I&apos;d bet on it: the graph plan above, and a clean
          virtual contest at Div. 2 pace. Hit both — I&apos;ll change my answer.
        </Prose>

        <SuggestionRow />
      </MentorTurn>

      </>
      ) : null}

      <LiveConversation />
    </div>
  );
}

function LiveConversation() {
  const { messages, pending, showDemo } = useChat();
  const endRef = useRef<HTMLDivElement>(null);

  const lastContentLen = messages[messages.length - 1]?.content.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending, lastContentLen]);

  if (messages.length === 0 && !pending) {
    if (showDemo) return null;
    return <WelcomeHero />;
  }

  return (
    <>
      {messages.map((m) =>
        m.role === "user" ? (
          <UserTurn key={m.id}>
            {m.images && m.images.length ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {m.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.dataUrl}
                    alt="attachment"
                    className="h-24 w-24 rounded-md border border-border object-cover"
                  />
                ))}
              </div>
            ) : null}
            {m.content}
          </UserTurn>
        ) : (
          <MentorTurn key={m.id} timestamp="Just now">
            <Prose>
              <TypewriterMarkdown id={m.id} content={m.content} />
            </Prose>
          </MentorTurn>
        ),
      )}
      {pending && (
        <MentorTurn timestamp="Thinking…">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Verdiqy is drafting a reply
          </div>
        </MentorTurn>
      )}
      <div ref={endRef} />
    </>
  );
}

// ---------- Turn containers ----------

function MentorTurn({ children, timestamp }: { children: ReactNode; timestamp: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
          <Sparkles className="size-3.5" strokeWidth={2.4} />
        </div>
        <div className="mt-2 w-px flex-1 bg-border/70" />
      </div>
      <div className="min-w-0 flex-1 space-y-4 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium">Verdiqy</span>
          <span className="text-2xs text-muted-foreground">{timestamp}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function UserTurn({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 pl-10">
      <div className="min-w-0 flex-1">
        <div className="rounded-lg rounded-tl-sm border border-border/70 bg-surface-muted/60 px-3.5 py-2.5 text-sm text-foreground">
          {children}
        </div>
      </div>
      <Avatar className="size-7 shrink-0">
        <AvatarFallback className="bg-primary/10 text-2xs font-medium text-primary">
          AK
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

function linkify(text: string): ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a
        key={`u-${i++}`}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {match[0]}
      </a>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ---------- Cards ----------

function Card({
  children,
  className,
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card shadow-[0_1px_0_0_rgb(0_0_0_/_0.02)]",
        tone === "primary" && "border-primary/25 bg-primary/[0.03]",
        tone === "warning" && "border-warning/30 bg-warning/[0.04]",
        tone === undefined || tone === "default" ? "border-border/70" : "",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardHead({
  icon: Icon,
  eyebrow,
  title,
  right,
}: {
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 pt-3.5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 grid size-6 place-items-center rounded-md bg-surface-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </div>
        <div className="leading-tight">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        </div>
      </div>
      {right}
    </div>
  );
}

// -- Verdict --

function VerdictCard() {
  const items = [
    {
      icon: Flag,
      label: "This week's focus",
      value: "Graph Theory",
      hint: "BFS · multi-source · 0-1 BFS",
      tone: "primary" as const,
    },
    {
      icon: Lock,
      label: "Avoid until unlocked",
      value: "1800 DP",
      hint: "12 prereq problems",
      tone: "warning" as const,
    },
    {
      icon: Target,
      label: "Contest-ready for",
      value: "Expert",
      hint: "CM in ~6 weeks",
      tone: "default" as const,
    },
  ];
  return (
    <Card tone="primary">
      <CardHead
        icon={Sparkles}
        eyebrow="Week of Jul 14"
        title="This week, in three sentences"
        right={
          <Badge variant="secondary" className="h-5 border-0 bg-background px-2 text-2xs">
            <StatusDot tone="success" className="mr-1.5" /> Fresh
          </Badge>
        }
      />
      <div className="mt-3 grid grid-cols-1 divide-y divide-border/70 border-t border-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-1 p-4">
            <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
              <it.icon className="size-3" />
              {it.label}
            </div>
            <p
              className={cn(
                "text-base font-semibold tracking-tight",
                it.tone === "primary" && "text-primary",
                it.tone === "warning" && "text-warning",
              )}
            >
              {it.value}
            </p>
            <p className="text-2xs text-muted-foreground">{it.hint}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// -- Rating --

function RatingCard() {
  return (
    <Card>
      <CardHead
        icon={LineChartIcon}
        eyebrow="Trajectory"
        title="12-week rating vs Candidate Master"
        right={
          <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-0.5 text-2xs font-medium text-success">
            <TrendingUp className="size-3" /> +152 in 12w
          </div>
        }
      />
      <div className="px-2 pb-2 pt-3">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ratingSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-primary)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="d"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <YAxis
                domain={[1550, 1950]}
                axisLine={false}
                tickLine={false}
                width={34}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <ReferenceLine
                y={1900}
                stroke="var(--primary)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: "CM · 1900",
                  position: "insideTopRight",
                  fill: "var(--primary)",
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="rating"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#rg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between border-t border-border/70 px-2 pt-3 text-2xs text-muted-foreground">
          <span>
            Current <span className="font-mono font-medium text-foreground">1764</span>
          </span>
          <span>
            Gap to CM <span className="font-mono font-medium text-foreground">136</span>
          </span>
          <span>
            ETA <span className="font-mono font-medium text-foreground">~6 weeks</span>
          </span>
        </div>
      </div>
    </Card>
  );
}

// -- Week Plan (timeline) --

function WeekPlan() {
  const [paused, setPaused] = useState(false);
  return (
    <Card>
      <CardHead
        icon={GitBranch}
        eyebrow="7-day plan · adjustable"
        title="Graph Theory sprint"
        right={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-2xs"
              onClick={() => {
                setPaused((p) => !p);
                toast.success(paused ? "Plan resumed" : "Plan paused");
              }}
            >
              {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
              {paused ? "Resume" : "Pause"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-2xs"
              onClick={() => toast.success("Plan scheduled to start Monday")}
            >
              <Play className="size-3" /> Start Mon
            </Button>
          </div>
        }
      />

      <ol className="mt-2 divide-y divide-border/60">
        {timeline.map((t, i) => (
          <li key={i} className="grid grid-cols-[52px_16px_1fr] items-start gap-2 px-4 py-3">
            <span className="pt-0.5 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
              {t.when}
            </span>
            <span className="mt-1.5 flex justify-center">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  t.tone === "primary" && "bg-primary",
                  t.tone === "warning" && "bg-warning",
                  t.tone === "danger" && "bg-destructive",
                  t.tone === "muted" && "bg-muted-foreground/40",
                )}
              />
            </span>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight text-foreground">{t.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.detail}</p>
              </div>
              <Badge
                variant="secondary"
                className="h-4 shrink-0 border-0 bg-surface-muted px-1.5 font-mono text-2xs text-muted-foreground"
              >
                {t.kind}
              </Badge>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// -- Prerequisites (problem list) --

function PrerequisiteCard() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const total = graphPlan.length;
  const completed = Object.values(done).filter(Boolean).length;
  const pct = Math.round((completed / total) * 100);
  const visible = showAll ? graphPlan : graphPlan.slice(0, 5);

  return (
    <Card tone="warning">
      <CardHead
        icon={Lightbulb}
        eyebrow="Prerequisite queue"
        title="12 problems before you touch 1800 DP"
        right={
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs text-muted-foreground">
              {completed}/{total}
            </span>
            <div className="h-1 w-16 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-warning transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        }
      />
      <ul className="mt-3 divide-y divide-border/60 border-t border-border/60">
        {visible.map((p) => {
          const isDone = !!done[p.id];
          return (
            <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <button
                onClick={() => setDone((d) => ({ ...d, [p.id]: !d[p.id] }))}
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
                  isDone
                    ? "border-success bg-success text-success-foreground"
                    : "border-border hover:border-foreground/40",
                )}
                aria-label={isDone ? "Mark undone" : "Mark done"}
              >
                {isDone ? <Check className="size-3" strokeWidth={3} /> : null}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xs text-muted-foreground">{p.id}</span>
                  <p
                    className={cn(
                      "truncate text-sm",
                      isDone ? "text-muted-foreground line-through" : "font-medium text-foreground",
                    )}
                  >
                    {p.title}
                  </p>
                </div>
                <p className="text-2xs text-muted-foreground">
                  {p.tag} · ~{p.minutes} min
                </p>
              </div>
              <RatingPill rating={p.rating} />
              <StatusPill status={p.status} />
              <a
                href={`https://codeforces.com/problemset/problem/${p.id.match(/^\d+/)?.[0] ?? ""}/${p.id.match(/[A-Z]\d*$/)?.[0] ?? ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                aria-label={`Open ${p.id} on Codeforces`}
              >
                <ArrowUpRight className="size-3.5" />
              </a>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
        <p className="text-2xs text-muted-foreground">
          Showing {visible.length} of {total} · sorted by expected learning gain
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setShowAll((s) => !s)}
        >
          {showAll ? "Show fewer" : `Show all ${total}`} <ChevronRight className="size-3.5" />
        </Button>
      </div>

    </Card>
  );
}

function RatingPill({ rating }: { rating: number }) {
  const tone =
    rating < 1600
      ? "text-success"
      : rating < 1900
        ? "text-primary"
        : rating < 2100
          ? "text-warning"
          : "text-destructive";
  return (
    <span className={cn("hidden font-mono text-2xs font-medium sm:inline", tone)}>{rating}</span>
  );
}

function StatusPill({ status }: { status: Problem["status"] }) {
  const map = {
    recommended: { label: "next", cls: "bg-primary/10 text-primary" },
    queued: { label: "queued", cls: "bg-surface-muted text-muted-foreground" },
    stretch: { label: "stretch", cls: "bg-warning/10 text-warning" },
  } as const;
  const m = map[status];
  return (
    <span
      className={cn(
        "hidden rounded-full px-1.5 py-0.5 font-mono text-2xs uppercase tracking-wide sm:inline",
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}

// -- Binary Search plateau --

function BinarySearchCard() {
  return (
    <Card>
      <CardHead
        icon={TrendingDown}
        eyebrow="Diagnosis"
        title="Binary Search · first-submission accuracy"
        right={
          <div className="flex items-center gap-1.5 rounded-md bg-muted-foreground/10 px-2 py-0.5 text-2xs font-medium text-muted-foreground">
            <Minus className="size-3" /> flat 6 months
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-[1fr_180px]">
        <div className="px-2 pb-3 pt-2">
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={binarySearchTrend}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="d"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  domain={[55, 80]}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <ReferenceLine
                  y={75}
                  stroke="var(--success)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="acc"
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "var(--muted-foreground)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2 border-t border-border/70 px-4 py-3 sm:border-l sm:border-t-0">
          <Metric label="First-try AC" value="66%" delta="—" tone="muted" />
          <Metric label="Off-by-one edits / prob" value="2.3" delta="+0.1" tone="danger" />
          <Metric label="Avg time to green" value="18m" delta="+2m" tone="danger" />
        </div>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "muted" | "danger" | "success";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-2xs text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {value}
        </span>
        <span
          className={cn(
            "font-mono text-2xs tabular-nums",
            tone === "success" && "text-success",
            tone === "danger" && "text-destructive",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {delta}
        </span>
      </div>
    </div>
  );
}

// -- Readiness --

function ReadinessCard() {
  const factors = [
    { label: "Rating floor (last 8)", score: 62, note: "unlucky rounds cost you 80 pts" },
    { label: "Graph problems ≥ 1800", score: 41, note: "under-practiced" },
    { label: "Div. 2 D consistency", score: 74, note: "solid" },
    { label: "Speed on A–C", score: 88, note: "excellent" },
    { label: "Contest cadence", score: 55, note: "1.2 / week · low" },
  ];
  const overall = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);

  return (
    <Card>
      <CardHead
        icon={Target}
        eyebrow="Readiness · Candidate Master"
        title="Not yet — but closer than last month"
        right={
          <div className="flex items-center gap-2">
            <div className="relative grid size-10 place-items-center">
              <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(overall / 100) * (2 * Math.PI * 15)} ${2 * Math.PI * 15}`}
                />
              </svg>
              <span className="absolute font-mono text-2xs font-semibold">{overall}</span>
            </div>
          </div>
        }
      />
      <ul className="mt-3 space-y-2 border-t border-border/70 px-4 py-3">
        {factors.map((f) => (
          <li key={f.label} className="grid grid-cols-[1fr_140px_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{f.label}</p>
              <p className="truncate text-2xs text-muted-foreground">{f.note}</p>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  "h-full transition-all",
                  f.score >= 75 ? "bg-success" : f.score >= 55 ? "bg-primary" : "bg-warning",
                )}
                style={{ width: `${f.score}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-2xs tabular-nums text-muted-foreground">
              {f.score}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// -- Action rows --

function ActionRow({
  primary,
  secondary,
}: {
  primary: { label: string; icon: typeof Sparkles };
  secondary: { label: string; icon: typeof Sparkles }[];
}) {
  const P = primary.icon;
  const { addAssistant } = useChat();
  const [pinned, setPinned] = useState(false);
  const [queued, setQueued] = useState(false);
  const [lossesShown, setLossesShown] = useState(false);

  const pinTemplate = () => {
    if (pinned) return;
    setPinned(true);
    addAssistant(binarySearchTemplateText);
    toast.success("Template pinned");
  };

  const queueProblems = () => {
    if (queued) return;
    setQueued(true);
    addAssistant(binarySearchProblemQueueText);
    toast.success("5 problems queued");
  };

  const showLosses = () => {
    if (lossesShown) return;
    setLossesShown(true);
    addAssistant(binarySearchLossesText);
    toast.success("Loss breakdown added");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" className="h-8 gap-1.5 text-xs" onClick={pinTemplate}>
        {pinned ? <Check className="size-3.5" /> : <P className="size-3.5" />}
        {pinned ? "Pinned" : primary.label}
      </Button>
      {secondary.map((s) => {
        const S = s.icon;
        const isQueueAction = s.label === "Queue 5 problems";
        const isLossesAction = s.label === "Show me the losses";
        const isQueued = isQueueAction && queued;
        const isLossesDone = isLossesAction && lossesShown;
        const handler = isQueueAction ? queueProblems : isLossesAction ? showLosses : undefined;
        const done = isQueued || isLossesDone;
        return (
          <Button
            key={s.label}
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handler}
          >
            {done ? <Check className="size-3.5" /> : <S className="size-3.5" />}
            {isQueued ? "Queued" : isLossesDone ? "Shown" : s.label}
          </Button>
        );
      })}
    </div>
  );
}

function SuggestionRow() {
  const { send, pending } = useChat();
  const options = [
    "Show my worst 5 unsolved",
    "Schedule the virtual for Fri",
    "Rewrite this plan for 45 min/day",
    "Explain 0-1 BFS in 60 sec",
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={pending}
          onClick={() => void send(o)}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CircleDot className="size-3 text-primary" />
          {o}
          <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}

// ---------- Composer ----------

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function downscaleImage(file: File, maxDim = 1280, quality = 0.85): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fileToDataUrl(file);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return fileToDataUrl(file);
  }
}

type PendingImage = { name: string; url: string; file: File };

function Composer() {
  const { send, pending, messages, draft, setDraft } = useChat();
  const value = draft;
  const setValue = setDraft;
  const [images, setImages] = useState<PendingImage[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasChatted = messages.length > 0;

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const next: PendingImage[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4)
      .map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f }));
    if (next.length) setImages((prev) => [...prev, ...next].slice(0, 4));
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [value]);

  // ⌘/Ctrl+K is reserved for the global command palette (app-shell).


  const hint = useMemo(
    () => [
      "Draft a 4-week plan for reaching CM",
      "Why did I fail 1547E?",
      "Compare my last 3 contests",
    ],
    [],
  );

  const submit = async () => {
    const text = value.trim();
    if ((!text && images.length === 0) || pending) return;
    const attached = images;
    setValue("");
    setImages([]);
    let payload: ChatImage[] | undefined;
    if (attached.length) {
      try {
        payload = await Promise.all(
          attached.map(async (img) => ({ dataUrl: await downscaleImage(img.file) })),
        );
      } catch {
        toast.error("Couldn't read that image");
        return;
      }
    }
    await send(text, payload);
  };

  return (
    <div className="sticky bottom-4 mt-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="rounded-xl border border-border bg-background/95 p-2 shadow-lg shadow-black/[0.04] backdrop-blur"
      >
        {images.length ? (
          <div className="flex flex-wrap gap-2 px-2 pt-2">
            {images.map((img, i) => (
              <div
                key={img.url}
                className="group relative h-14 w-14 overflow-hidden rounded-md border border-border bg-surface-muted"
              >
                <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                  aria-label={`Remove ${img.name}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onPickFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex items-end gap-2 px-2 pt-1.5">
          <div className="relative mt-1 shrink-0">
            {pending ? (
              <span
                aria-hidden
                className="absolute inset-0 -m-1 rounded-full bg-primary/30 blur-sm animate-ping"
              />
            ) : null}
            <Zap
              className={cn(
                "relative size-4 text-primary transition-transform",
                pending && "animate-pulse drop-shadow-[0_0_6px_hsl(var(--primary))]",
              )}
            />
          </div>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter inserts a newline.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder="Ask Verdiqy anything — 'What's my weakest topic under time pressure?'"
            className="min-h-[24px] w-full resize-none border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
            disabled={pending}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Attach image"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
          >
            <ImagePlus className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="size-8 shrink-0"
            disabled={(!value.trim() && images.length === 0) || pending}
            aria-label="Send"
            onClick={() => void submit()}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
        {hasChatted ? null : (
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/70 px-2 pt-2">
          <div className="flex flex-wrap items-center gap-1">
            {hint.map((h) => (
              <button
                type="button"
                key={h}
                onClick={() => setValue(h)}
                className="rounded-md px-1.5 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {h}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-2xs text-muted-foreground">
            <Kbd>↵</Kbd>
            <span className="ml-1 hidden sm:inline">to send</span>
            <span className="mx-1 hidden sm:inline">·</span>
            <Kbd>⇧</Kbd>
            <Kbd>↵</Kbd>
            <span className="ml-1 hidden sm:inline">newline</span>
            <button
              type="button"
              onClick={() => {
                setValue("");
                setImages([]);
                ref.current?.focus();
              }}
              disabled={pending}
              className="ml-2 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Clear input"
              title="Clear input"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
        )}
      </form>
      <p className="mt-2 text-center text-2xs text-muted-foreground">
        Verdiqy trains on your submissions, contest history, and time-of-day performance.{" "}
        <button className="underline-offset-2 hover:underline">What it doesn&apos;t see →</button>
      </p>
      <UnusedIconAnchor />
    </div>
  );
}

// Keep tree-shaker happy on icons imported for the design language.
function UnusedIconAnchor() {
  return (
    <span className="hidden">
      <Flame />
    </span>
  );
}
