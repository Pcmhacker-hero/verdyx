import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const PROFILE_UPDATED_EVENT = "verdiqy:profile-updated";

/** Notify all mounted useCurrentUser() consumers to reload name/avatar. */
export function notifyProfileUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  }
}

export interface CurrentUserInfo {
  name: string;
  initials: string;
  email: string | null;
  avatarUrl: string | null;
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns the currently signed-in user's display name, initials, and email.
 * Falls back to email prefix when no display_name is set in user_metadata.
 */
export function useCurrentUser(): CurrentUserInfo | null {
  const [info, setInfo] = useState<CurrentUserInfo | null>(null);
  const [nonce, setNonce] = useState(0);
  const bump = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        if (!cancelled) setInfo(null);
        return;
      }
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaName =
        (typeof meta.display_name === "string" && meta.display_name) ||
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        "";
      const emailPrefix = user.email ? user.email.split("@")[0] : "";
      let name = (metaName || emailPrefix || "User").toString();
      let avatarUrl: string | null =
        (typeof meta.avatar_url === "string" && meta.avatar_url) ||
        (typeof meta.picture === "string" && meta.picture) ||
        null;

      // The profile row is the source of truth: it holds uploaded avatars
      // (stored as a private storage path) and the edited display name.
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, cf_title_photo")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.display_name) name = profile.display_name;
      const stored = profile?.avatar_url ?? null;
      if (stored) {
        if (/^https?:\/\//i.test(stored)) {
          avatarUrl = stored;
        } else {
          const { data: signed } = await supabase.storage
            .from("avatars")
            .createSignedUrl(stored, 60 * 60 * 24);
          if (signed?.signedUrl) avatarUrl = signed.signedUrl;
        }
      } else if (!avatarUrl && profile?.cf_title_photo) {
        avatarUrl = profile.cf_title_photo;
      }

      if (!cancelled) {
        setInfo({
          name,
          initials: computeInitials(name),
          email: user.email ?? null,
          avatarUrl,
        });
      }
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load();
      }
    });
    window.addEventListener(PROFILE_UPDATED_EVENT, bump);
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, bump);
    };
  }, [nonce, bump]);

  return info;
}
