import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * First-time user cue: the internal app is a live demo populated with
 * sample data ("Alex Kim's workspace"). Without this hint, a brand-new
 * visitor who clicks around from the landing page can't tell whether
 * the numbers, streak, and mission are theirs or illustrative.
 *
 * Hidden entirely once the visitor is authenticated — their workspace
 * is real, so the "live demo" framing no longer applies.
 *
 * Dismissal is persisted in localStorage so returning explorers aren't
 * nagged. Rendered above <main> so it never covers content.
 */
const STORAGE_KEY = "atlas.demo-banner.dismissed";

export function DemoBanner() {
  const [visible, setVisible] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!visible || authed) return null;


  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable — dismissal is session-only */
    }
  };

  return (
    <div
      role="status"
      aria-label="Demo workspace notice"
      className="flex items-center gap-3 border-b border-border/70 bg-primary/[0.06] px-4 py-2 text-xs text-foreground md:px-6"
    >
      <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 truncate">
        <span className="font-medium">You're exploring a live demo.</span>{" "}
        <span className="text-muted-foreground">
          Sample data belongs to a fictional user — sign up to make it yours.
        </span>
      </p>
      <Link
        to="/auth"
        className="hidden shrink-0 rounded-full bg-primary px-3 py-1 text-2xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90 sm:inline-flex"
      >
        Create your workspace
      </Link>
      <Link
        to="/auth"
        className="shrink-0 rounded-full bg-primary px-3 py-1 text-2xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90 sm:hidden"
      >
        Sign up
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss demo notice"
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
