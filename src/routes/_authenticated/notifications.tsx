import { createFileRoute } from "@tanstack/react-router";
import { Bell, CalendarClock, Check, CheckCircle2, MessageSquare, Sparkles, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Verdiqy" },
      {
        name: "description",
        content: "Stay current with contest reminders, mentor alerts, and progress milestones in Verdiqy.",
      },
      { property: "og:title", content: "Notifications · Verdiqy" },
      {
        property: "og:description",
        content: "Contest reminders, mentor alerts, and milestone updates for your Verdiqy workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

type Notification = {
  id: string;
  icon: typeof Sparkles;
  label: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
};

const seedNotifications: Notification[] = [
  {
    id: "n1",
    icon: Sparkles,
    label: "Mentor",
    title: "New training insight",
    detail: "Your latest submissions show a recurring off-by-one pattern in interval DP.",
    time: "Now",
    unread: true,
  },
  {
    id: "n2",
    icon: CalendarClock,
    label: "Contest",
    title: "Virtual contest starts soon",
    detail: "Round #912 is ready with a 90-minute Div. 2 set tailored to your rating band.",
    time: "25m",
    unread: true,
  },
  {
    id: "n3",
    icon: Trophy,
    label: "Milestone",
    title: "Seven-day streak completed",
    detail: "You solved 23 problems this week and improved graph accuracy by 12%.",
    time: "3h",
    unread: false,
  },
  {
    id: "n4",
    icon: MessageSquare,
    label: "Community",
    title: "New reply on your note",
    detail: "A top contributor added a proof sketch to your binary search write-up.",
    time: "Yesterday",
    unread: false,
  },
];

function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(seedNotifications);
  const unread = useMemo(() => items.filter((item) => item.unread).length, [items]);

  const markOne = (id: string) => {
    setItems((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target || !target.unread) return prev;
      return prev.map((n) => (n.id === id ? { ...n, unread: false } : n));
    });
  };

  const markAll = () => {
    if (unread === 0) {
      toast.info("You're all caught up");
      return;
    }
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast.success(`Marked ${unread} notification${unread === 1 ? "" : "s"} as read`);
  };

  return (
    <AppShell breadcrumb={[{ label: "Notifications" }]}>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Alerts
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Contest reminders, mentor alerts, and milestone updates from your Verdiqy workspace.
            </p>
          </div>
          <Button size="sm" onClick={markAll} disabled={unread === 0}>
            <CheckCircle2 className="size-4" />
            Mark all read
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bell className="size-4 text-primary" />
              Recent alerts
            </div>
            <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
              {unread} new
            </Badge>
          </div>

          <div className="divide-y divide-border">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.id}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-4 py-4 transition-colors hover:bg-surface-muted/60",
                    item.unread && "bg-primary/5",
                  )}
                >
                  <div className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="h-5 px-1.5 text-2xs">
                        {item.label}
                      </Badge>
                      {item.unread ? <span className="size-2 rounded-full bg-primary" /> : null}
                    </div>
                    <h2 className="mt-2 truncate text-sm font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-mono text-2xs text-muted-foreground">{item.time}</span>
                    {item.unread ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-2xs"
                        onClick={() => markOne(item.id)}
                        aria-label={`Mark ${item.title} as read`}
                      >
                        <Check className="size-3" />
                        Mark read
                      </Button>
                    ) : (
                      <span className="font-mono text-2xs text-muted-foreground/70">Read</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
