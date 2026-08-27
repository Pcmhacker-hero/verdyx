import { createFileRoute } from "@tanstack/react-router";
import { Archive, ArchiveRestore, Check, CheckCircle2, Inbox, MessageSquare, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox · Verdiqy" },
      {
        name: "description",
        content: "Review coaching updates, community replies, and practice reminders in your Verdiqy inbox.",
      },
      { property: "og:title", content: "Inbox · Verdiqy" },
      {
        property: "og:description",
        content: "Your Verdiqy inbox for coaching updates, community replies, and practice reminders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InboxPage,
});

type Message = {
  id: string;
  from: string;
  initials: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  tone: string;
  archived: boolean;
};

const seedMessages: Message[] = [
  {
    id: "m1",
    from: "Verdiqy Mentor",
    initials: "AM",
    title: "Your DP mistake review is ready",
    body: "I found the repeated transition pattern behind yesterday's wrong answers.",
    time: "8m",
    unread: true,
    tone: "primary",
    archived: false,
  },
  {
    id: "m2",
    from: "Kamil Debowski",
    initials: "KD",
    title: "Replied to your editorial note",
    body: "Nice observation on monotonic predicates — I added one counterexample.",
    time: "42m",
    unread: true,
    tone: "success",
    archived: false,
  },
  {
    id: "m3",
    from: "Contest Simulator",
    initials: "CS",
    title: "Virtual Round #912 starts in 25 minutes",
    body: "Four problems are queued based on your current 1800–2100 target band.",
    time: "1h",
    unread: false,
    tone: "warning",
    archived: false,
  },
  {
    id: "m4",
    from: "Verdiqy Coach",
    initials: "AC",
    title: "Weekly focus plan updated",
    body: "Graph shortest paths moved ahead of number theory after your latest submissions.",
    time: "Yesterday",
    unread: false,
    tone: "muted",
    archived: false,
  },
];

function InboxPage() {
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [showArchived, setShowArchived] = useState(false);

  const visible = useMemo(
    () => messages.filter((m) => (showArchived ? m.archived : !m.archived)),
    [messages, showArchived],
  );
  const unread = useMemo(
    () => messages.filter((m) => !m.archived && m.unread).length,
    [messages],
  );
  const archivedCount = useMemo(() => messages.filter((m) => m.archived).length, [messages]);
  const readInInbox = useMemo(
    () => messages.filter((m) => !m.archived && !m.unread).length,
    [messages],
  );

  const markOne = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id && m.unread ? { ...m, unread: false } : m)),
    );
  };

  const markAllRead = () => {
    if (unread === 0) {
      toast.info("Inbox is already all read");
      return;
    }
    setMessages((prev) => prev.map((m) => (m.archived ? m : { ...m, unread: false })));
    toast.success(`Marked ${unread} message${unread === 1 ? "" : "s"} as read`);
  };

  const archiveOne = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, archived: !m.archived, unread: false } : m)),
    );
  };

  const archiveRead = () => {
    if (readInInbox === 0) {
      toast.info("No read messages to archive");
      return;
    }
    setMessages((prev) => prev.map((m) => (!m.archived && !m.unread ? { ...m, archived: true } : m)));
    toast.success(`Archived ${readInInbox} message${readInInbox === 1 ? "" : "s"}`);
  };

  return (
    <AppShell breadcrumb={[{ label: "Inbox" }]}>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Messages
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Inbox</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Coaching updates, community replies, and practice reminders collected in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived((v) => !v)}
            >
              <ArchiveRestore className="size-4" />
              {showArchived ? `Inbox (${messages.length - archivedCount})` : `Archived (${archivedCount})`}
            </Button>
            <Button variant="outline" size="sm" onClick={archiveRead} disabled={readInInbox === 0}>
              <Archive className="size-4" />
              Archive read
            </Button>
            <Button size="sm" onClick={markAllRead} disabled={unread === 0}>
              <CheckCircle2 className="size-4" />
              Mark all read
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Inbox className="size-4 text-primary" />
                {showArchived ? "Archived" : "Latest"}
              </div>
              <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
                {showArchived ? `${archivedCount} archived` : `${unread} unread`}
              </Badge>
            </div>
            <div className="divide-y divide-border">
              {visible.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {showArchived ? "No archived messages." : "Inbox zero. Nice work."}
                </div>
              ) : (
                visible.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "group flex gap-3 px-4 py-4 transition-colors hover:bg-surface-muted/60",
                      message.unread && !message.archived && "bg-primary/5",
                    )}
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-2xs font-medium text-primary">
                        {message.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{message.from}</p>
                          <h2 className="mt-0.5 truncate text-sm font-semibold text-foreground">
                            {message.title}
                          </h2>
                        </div>
                        <span className="shrink-0 font-mono text-2xs text-muted-foreground">
                          {message.time}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{message.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {message.unread && !message.archived ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-2 text-2xs"
                            onClick={() => markOne(message.id)}
                          >
                            <Check className="size-3" />
                            Mark read
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-2xs"
                          onClick={() => archiveOne(message.id)}
                        >
                          {message.archived ? (
                            <>
                              <ArchiveRestore className="size-3" />
                              Restore
                            </>
                          ) : (
                            <>
                              <Archive className="size-3" />
                              Archive
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {message.unread && !message.archived ? (
                      <span className="mt-2 size-2 rounded-full bg-primary" />
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="size-4 text-primary" />
              Smart summary
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {showArchived
                ? archivedCount === 0
                  ? "Nothing archived yet. Archived messages will appear here."
                  : `${archivedCount} archived message${archivedCount === 1 ? "" : "s"}. Restore anything you still need.`
                : unread === 0
                  ? readInInbox === 0
                    ? "Inbox zero. Nothing waiting for you right now."
                    : "All caught up. Archive read items to keep the inbox clean."
                  : `${unread} item${unread === 1 ? "" : "s"} need attention — start with the newest and archive as you go.`}
            </p>
            {!showArchived && unread > 0 ? (
              <ul className="mt-3 space-y-2">
                {messages
                  .filter((m) => !m.archived && m.unread)
                  .slice(0, 3)
                  .map((m) => (
                    <li key={m.id} className="flex items-start gap-2 text-2xs text-muted-foreground">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="truncate">
                        <span className="font-medium text-foreground">{m.from}</span> — {m.title}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}
            <div className="mt-4 rounded-md bg-surface-muted p-3 text-sm text-muted-foreground">
              <MessageSquare className="mb-2 size-4 text-primary" />
              {showArchived
                ? "Restore any archived message to bring it back to your inbox."
                : unread > 0
                  ? "Tap Mark read on each item, or use Mark all read up top."
                  : readInInbox > 0
                    ? "Use Archive read to move everything read out of the inbox."
                    : "Most replies arrive after shared notes and cheat sheets are published."}
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
