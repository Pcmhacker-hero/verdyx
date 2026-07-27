import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      const name = (metaName || emailPrefix || "User").toString();
      const avatarUrl =
        (typeof meta.avatar_url === "string" && meta.avatar_url) ||
        (typeof meta.picture === "string" && meta.picture) ||
        null;
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
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return info;
}
