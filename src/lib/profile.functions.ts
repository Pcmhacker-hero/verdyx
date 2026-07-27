import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CFUserInfo = {
  handle: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution?: number;
  rank?: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  registrationTimeSeconds?: number;
  titlePhoto?: string;
  avatar?: string;
};

async function fetchCodeforcesUser(handle: string): Promise<CFUserInfo | null> {
  const res = await fetch(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
    { headers: { "user-agent": "atlas-app/1.0" } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { status: string; result?: CFUserInfo[] };
  if (json.status !== "OK" || !json.result?.length) return null;
  return json.result[0];
}

async function signAvatar(
  supabase: {
    storage: {
      from: (b: string) => {
        createSignedUrl: (
          p: string,
          e: number,
        ) => Promise<{ data: { signedUrl: string } | null }>;
      };
    };
  },
  path: string | null,
) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24);
  return data?.signedUrl ?? null;
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    // Auto-refresh Codeforces snapshot when linked and stale (>5 min) so
    // rank/rating stay in sync with the live CF profile without a manual re-link.
    let fresh = data;
    const handle = (data as { codeforces_handle?: string | null }).codeforces_handle;
    const syncedAt = (data as { cf_synced_at?: string | null }).cf_synced_at;
    const staleMs = 5 * 60 * 1000;
    const isStale = !syncedAt || Date.now() - new Date(syncedAt).getTime() > staleMs;
    if (handle && isStale) {
      const cf = await fetchCodeforcesUser(handle);
      if (cf) {
        const patch = {
          cf_rating: cf.rating ?? null,
          cf_max_rating: cf.maxRating ?? null,
          cf_rank: cf.rank ?? null,
          cf_title_photo: cf.titlePhoto ?? cf.avatar ?? null,
          cf_country: cf.country ?? null,
          cf_city: cf.city ?? null,
          cf_organization: cf.organization ?? null,
          cf_first_name: cf.firstName ?? null,
          cf_last_name: cf.lastName ?? null,
          cf_registered_at: cf.registrationTimeSeconds
            ? new Date(cf.registrationTimeSeconds * 1000).toISOString()
            : null,
          cf_synced_at: new Date().toISOString(),
        };
        await context.supabase
          .from("profiles")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update(patch as any)
          .eq("id", context.userId);
        fresh = { ...data, ...patch } as typeof data;
      }
    }

    const avatar_signed_url = await signAvatar(
      context.supabase,
      (fresh as { avatar_url?: string | null }).avatar_url ?? null,
    );
    return { ...fresh, avatar_signed_url };
  });


export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const d = (raw ?? {}) as {
      display_name?: unknown;
      codeforces_handle?: unknown;
      target_rating?: unknown;
      onboarded?: unknown;
      avatar_url?: unknown;
      public_badges?: unknown;
    };
    const badges =
      Array.isArray(d.public_badges)
        ? Array.from(
            new Set(
              d.public_badges
                .filter((b): b is string => typeof b === "string")
                .map((b) => b.trim().slice(0, 40))
                .filter(Boolean),
            ),
          ).slice(0, 20)
        : undefined;
    return {
      display_name:
        typeof d.display_name === "string" ? d.display_name.trim().slice(0, 60) : undefined,
      codeforces_handle:
        typeof d.codeforces_handle === "string"
          ? d.codeforces_handle.trim().slice(0, 40) || null
          : undefined,
      target_rating:
        typeof d.target_rating === "number" && d.target_rating >= 800 && d.target_rating <= 3500
          ? Math.round(d.target_rating)
          : undefined,
      onboarded: typeof d.onboarded === "boolean" ? d.onboarded : undefined,
      avatar_url:
        typeof d.avatar_url === "string" ? d.avatar_url.slice(0, 500) : d.avatar_url === null ? null : undefined,
      public_badges: badges,
    };
  })
  .handler(async ({ data, context }) => {
    const patch: Record<string, string | number | boolean | null | string[]> = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.codeforces_handle !== undefined) patch.codeforces_handle = data.codeforces_handle;
    if (data.target_rating !== undefined) patch.target_rating = data.target_rating;
    if (data.onboarded !== undefined) patch.onboarded = data.onboarded;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
    if (data.public_badges !== undefined) patch.public_badges = data.public_badges;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await context.supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const linkCodeforcesHandle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => raw as { handle?: unknown })
  .handler(async () => ({ ok: true as const }));

/**
 * Fills profile display name / avatar from the auth provider metadata
 * (e.g. Google name + picture) when those fields are still empty.
 */
export const syncProfileFromAuthIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const meta = ((context.claims as { user_metadata?: Record<string, unknown> })
      .user_metadata ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const name = str(meta.display_name) ?? str(meta.full_name) ?? str(meta.name);
    const picture = str(meta.avatar_url) ?? str(meta.picture);

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile) return { ok: false as const };

    const patch: Record<string, string> = {};
    if (!profile.display_name && name) patch.display_name = name.slice(0, 60);
    if (!profile.avatar_url && picture) patch.avatar_url = picture.slice(0, 500);
    if (!Object.keys(patch).length) return { ok: true as const };

    const { error } = await context.supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const _linkCodeforcesHandlePlaceholder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const d = (raw ?? {}) as { handle?: unknown };
    const handle = typeof d.handle === "string" ? d.handle.trim() : "";
    if (!/^[A-Za-z0-9_.-]{2,40}$/.test(handle)) {
      throw new Error("Enter a valid Codeforces handle (2–40 letters, digits, . _ -).");
    }
    return { handle };
  })
  .handler(async ({ data, context }) => {
    const cf = await fetchCodeforcesUser(data.handle);
    if (!cf) {
      throw new Error(
        `Codeforces user "${data.handle}" not found. Double-check the handle on codeforces.com.`,
      );
    }
    const patch = {
      codeforces_handle: cf.handle,
      cf_rating: cf.rating ?? null,
      cf_max_rating: cf.maxRating ?? null,
      cf_rank: cf.rank ?? null,
      cf_title_photo: cf.titlePhoto ?? cf.avatar ?? null,
      cf_country: cf.country ?? null,
      cf_city: cf.city ?? null,
      cf_organization: cf.organization ?? null,
      cf_first_name: cf.firstName ?? null,
      cf_last_name: cf.lastName ?? null,
      cf_registered_at: cf.registrationTimeSeconds
        ? new Date(cf.registrationTimeSeconds * 1000).toISOString()
        : null,
      cf_synced_at: new Date().toISOString(),
    };
    const { error } = await context.supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const, cf };
  });

export const unlinkCodeforcesHandle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        codeforces_handle: null,
        cf_rating: null,
        cf_max_rating: null,
        cf_rank: null,
        cf_title_photo: null,
        cf_country: null,
        cf_city: null,
        cf_organization: null,
        cf_first_name: null,
        cf_last_name: null,
        cf_registered_at: null,
        cf_synced_at: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyCodeforcesRatingHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("codeforces_handle")
      .eq("id", context.userId)
      .maybeSingle();
    const handle = profile?.codeforces_handle;
    if (!handle) return { handle: null as string | null, history: [] as CFRatingChange[] };
    const res = await fetch(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
      { headers: { "user-agent": "atlas-app/1.0" } },
    );
    if (!res.ok) return { handle, history: [] as CFRatingChange[] };
    const json = (await res.json()) as { status: string; result?: CFRatingChange[] };
    if (json.status !== "OK") return { handle, history: [] as CFRatingChange[] };
    return { handle, history: json.result ?? [] };
  });

export type CFRatingChange = {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
};
