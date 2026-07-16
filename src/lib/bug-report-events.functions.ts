import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const eventSchema = z.object({
  eventType: z.enum(["opened", "submitted", "failed", "cancelled"]),
  bugReportId: z.string().uuid().optional().nullable(),
  pageUrl: z.string().trim().max(600).optional().nullable(),
  severity: z.enum(["low", "normal", "high"]).optional().nullable(),
  errorMessage: z.string().trim().max(500).optional().nullable(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const logBugReportEvent = createServerFn({ method: "POST" })
  .inputValidator((data) => eventSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { error } = await supabase.from("bug_report_events").insert({
      event_type: data.eventType,
      bug_report_id: data.bugReportId ?? null,
      page_url: data.pageUrl ?? null,
      severity: data.severity ?? null,
      error_message: data.errorMessage ?? null,
      meta: (data.meta ?? {}) as never,
    });

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
