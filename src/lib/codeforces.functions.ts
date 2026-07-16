import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const syncProblemset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { syncProblemsetCore } = await import("./sync.server");
    return syncProblemsetCore();
  });

export const syncUserSubmissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("codeforces_handle")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.codeforces_handle) return { synced: 0, reason: "no_handle" as const };
    const { syncUserSubmissionsCore } = await import("./sync.server");
    return syncUserSubmissionsCore(context.userId, profile.codeforces_handle);
  });
