import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AuthSearch = { next?: string; mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Verdiqx" },
      {
        name: "description",
        content:
          "Sign in to Verdiqx — your personal competitive programming coach. Click Start Next and improve every day.",
      },
      { property: "og:title", content: "Sign in · Verdiqx" },
      {
        property: "og:description",
        content: "Click Start Next. Solve. Repeat. Verdiqx keeps picking the exact problem you should do next.",
      },
    ],
  }),
  validateSearch: (raw: Record<string, unknown>): AuthSearch => ({
    next: typeof raw.next === "string" && raw.next.startsWith("/") ? raw.next : undefined,
    mode: raw.mode === "signup" ? "signup" : "signin",
  }),
  component: AuthPage,
});

function safeNext(next: string | undefined): string {
  if (!next) return "/problems";
  // must be same-origin relative path
  if (!next.startsWith("/") || next.startsWith("//")) return "/problems";
  return next;
}

/**
 * The Lovable managed OAuth broker is served from `/~oauth/*`, a path that only
 * exists behind Lovable's proxy (lovable.app / custom domains attached to it).
 * On third-party hosts (Vercel, Netlify, self-hosted) that path 404s, so we
 * fall back to Supabase's own OAuth redirect flow.
 */
function isLovableHost(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".lovable.app") || h.endsWith(".lovable.dev");
}

async function startOAuth(provider: "google" | "apple", returnUrl: string) {
  // Social sign-in is issued by the managed broker, which only exists on
  // Lovable-hosted origins. Elsewhere we surface email sign-in instead of
  // hitting Supabase directly (no provider secret is configured there).
  return lovable.auth.signInWithOAuth(provider, { redirect_uri: returnUrl });
}

function AuthPage() {
  const navigate = useNavigate();
  const { next, mode: initialMode } = useSearch({ from: "/auth" });
  const target = safeNext(next);

  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [socialAvailable, setSocialAvailable] = useState(false);

  useEffect(() => {
    setSocialAvailable(isLovableHost());
  }, []);

  // If already signed in (or session hydrates after OAuth return), bounce to target
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) navigate({ to: target, replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        navigate({ to: target, replace: true });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate, target]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(target)}`,
          },
        });
        if (error) throw error;
        toast.success("Account created. Signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: target, replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      // redirect_uri MUST be a public same-origin URL. Return to /auth with
      // ?next=<target>; the "already signed in" effect below navigates on.
      const returnUrl = `${window.location.origin}/auth?next=${encodeURIComponent(target)}`;
      const result = await startOAuth("google", returnUrl);
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        return;
      }
      if (result.redirected) return; // browser is redirecting
      navigate({ to: target, replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onApple = async () => {
    setAppleLoading(true);
    try {
      const returnUrl = `${window.location.origin}/auth?next=${encodeURIComponent(target)}`;
      const result = await startOAuth("apple", returnUrl);
      if (result.error) {
        toast.error(result.error.message ?? "Apple sign-in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: target, replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-background md:grid-cols-2">
      {/* Left panel — brand */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background md:block">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-info/20 blur-3xl" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="size-3 text-primary" /> AI-first coach
            </div>
            <h1 className="mt-5 max-w-md font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              Stop deciding what to solve.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Sign in and click <span className="font-medium text-foreground">Start Next</span>. Verdiqx picks
              the exact problem you should do — every time.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Verdiqx Labs</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <div className="grid size-7 place-items-center rounded-md bg-foreground text-background">
              <span className="font-display text-xs font-bold">A</span>
            </div>
            <span className="font-display text-sm font-semibold">Verdiqx</span>
          </div>

          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue coaching."
              : "One minute to your first mission."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 h-11 w-full rounded-full"
            onClick={onGoogle}
            disabled={googleLoading || appleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 size-4" />
            )}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="mt-3 h-11 w-full rounded-full"
            onClick={onApple}
            disabled={appleLoading || googleLoading || loading}
          >
            {appleLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <AppleIcon className="mr-2 size-4" />
            )}
            Continue with Apple
          </Button>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border/60" />
            or email
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <Label className="text-xs">Display name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex"
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-full"
              disabled={loading || googleLoading}
            >
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Verdiqx?" : "Have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 11.5-4.9 11.5-11.7 0-.8-.1-1.4-.2-2H12z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.13 3.03-.76.86-2 1.53-3.05 1.45-.13-1.1.42-2.24 1.1-2.98.77-.83 2.07-1.45 3.08-1.5zM20.5 17.16c-.55 1.27-.81 1.83-1.52 2.94-.98 1.55-2.37 3.48-4.09 3.5-1.53.02-1.92-1-4-1-2.07 0-2.5.98-4.03 1.02-1.72.04-3.02-1.68-4-3.23-2.74-4.34-3.03-9.44-1.34-12.15 1.2-1.92 3.1-3.05 4.88-3.05 1.82 0 2.96 1 4.46 1 1.45 0 2.34-1 4.44-1 1.6 0 3.28.87 4.48 2.37-3.94 2.16-3.3 7.8.72 9.6z" />
    </svg>
  );
}
