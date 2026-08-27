import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bug, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listBugReportEvents } from "@/lib/bug-report-events-read.functions";

export const Route = createFileRoute("/_authenticated/admin/bug-reports")({
  head: () => ({
    meta: [
      { title: "Bug Report Analytics · Verdiqy" },
      { name: "description", content: "Track Report a bug usage and submission outcomes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BugReportsAdmin,
});

const TYPE_LABEL: Record<string, string> = {
  opened: "Opened",
  submitted: "Submitted",
  cancelled: "Cancelled",
  failed: "Failed",
};

const TYPE_TONE: Record<string, string> = {
  opened: "bg-primary/10 text-primary border-primary/30",
  submitted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  failed: "bg-red-500/10 text-red-600 border-red-500/30",
};

function BugReportsAdmin() {
  const list = useServerFn(listBugReportEvents);
  const query = useQuery({
    queryKey: ["admin", "bug-report-events"],
    queryFn: () => list(),
    refetchOnWindowFocus: false,
  });

  const counts = query.data?.counts ?? {};
  const rows = query.data?.rows ?? [];
  const total = rows.length;
  const submitted = counts.submitted ?? 0;
  const opened = counts.opened ?? 0;
  const conversion = opened > 0 ? Math.round((submitted / opened) * 100) : 0;

  return (
    <AppShell breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Bug Reports" }]}>
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="text-2xs uppercase tracking-widest text-muted-foreground">Admin</div>
            <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold">
              <Bug className="size-7 text-primary" />
              Bug Report Events
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Last 200 events across opened, submitted, cancelled, and failed states.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Total" value={total} />
          <Stat label="Opened" value={opened} tone="text-primary" />
          <Stat label="Submitted" value={submitted} tone="text-emerald-600" />
          <Stat label="Cancelled" value={counts.cancelled ?? 0} />
          <Stat label="Failed" value={counts.failed ?? 0} tone="text-red-600" />
        </div>

        <div className="mb-6 rounded-xl border border-border/60 bg-surface-muted/40 p-4 text-sm">
          <div className="text-muted-foreground">Open → Submit conversion</div>
          <div className="mt-1 text-2xl font-semibold">
            {opened > 0 ? `${conversion}%` : "—"}
          </div>
        </div>

        {query.isLoading && (
          <div className="rounded-xl border border-dashed border-border/60 py-14 text-center text-sm text-muted-foreground">
            Loading events…
          </div>
        )}

        {query.error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
            {(query.error as Error).message}
          </div>
        )}

        {!query.isLoading && !query.error && rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 py-14 text-center text-sm text-muted-foreground">
            No events yet. Trigger the Report a bug button to see logs here.
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/60 text-left text-2xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Page</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const meta = safeParse(r.meta);
                  const source = typeof meta?.source === "string" ? meta.source : null;
                  return (
                    <tr key={r.id} className="border-t border-border/50 align-top">
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={TYPE_TONE[r.event_type]}>
                          {TYPE_LABEL[r.event_type] ?? r.event_type}
                        </Badge>
                        {source && (
                          <span className="ml-2 text-2xs uppercase tracking-wider text-muted-foreground">
                            {source}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 capitalize text-muted-foreground">
                        {r.severity ?? "—"}
                      </td>
                      <td className="max-w-[280px] truncate px-3 py-2 text-muted-foreground">
                        {r.page_url ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {r.error_message ?? (r.bug_report_id ? `report ${r.bug_report_id.slice(0, 8)}…` : "—")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface-muted/40 p-3">
      <div className="text-2xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function safeParse(s: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
