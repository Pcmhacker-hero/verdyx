import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type DbRow = {
  id: string;
  event_type: "opened" | "submitted" | "failed" | "cancelled";
  bug_report_id: string | null;
  page_url: string | null;
  severity: "low" | "normal" | "high" | null;
  error_message: string | null;
  meta: unknown;
  created_at: string;
};

export type BugReportEventRow = Omit<DbRow, "meta"> & { meta: string };

export const listBugReportEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>;
      from: (table: string) => {
        select: (cols: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: DbRow[] | null; error: { message: string } | null }>;
          };
        };
      };
    };

    const { data: isAdmin, error: roleError } = await db.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await db
      .from("bug_report_events")
      .select("id, event_type, bug_report_id, page_url, severity, error_message, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const raw = data ?? [];
    const rows: BugReportEventRow[] = raw.map((r) => ({
      ...r,
      meta: JSON.stringify(r.meta ?? {}),
    }));
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.event_type] = (counts[r.event_type] ?? 0) + 1;

    return { rows, counts };
  });
