import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  Flame,
  Loader2,
  Medal,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notifyProfileUpdated } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyProfile,
  updateMyProfile,
  linkCodeforcesHandle,
  unlinkCodeforcesHandle,
} from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/settings/profile")({
  head: () => ({
    meta: [
      { title: "Profile settings · Verdiqy" },
      {
        name: "description",
        content:
          "Update your avatar, display name, Codeforces handle, and the badges shown on your public Verdiqy profile.",
      },
      { property: "og:title", content: "Profile settings · Verdiqy" },
      {
        property: "og:description",
        content: "Manage your Verdiqy profile: avatar, handle, and public badges.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfileSettingsPage,
});

type BadgeOption = {
  id: string;
  label: string;
  description: string;
  icon: typeof Star;
};

const BADGE_OPTIONS: BadgeOption[] = [
  { id: "pro", label: "Pro", description: "Verdiqy Pro subscriber", icon: Sparkles },
  { id: "streak", label: "On a streak", description: "Show your active-day streak", icon: Flame },
  { id: "mentor", label: "Mentor", description: "You help others in the community", icon: Shield },
  { id: "contest_winner", label: "Contest winner", description: "Placed top-3 in a contest", icon: Trophy },
  { id: "early_adopter", label: "Early adopter", description: "Joined during early access", icon: Rocket },
  { id: "top_solver", label: "Top solver", description: "High solve count this month", icon: Medal },
  { id: "verified", label: "Verified", description: "Codeforces handle verified", icon: CheckCircle2 },
  { id: "rising_star", label: "Rising star", description: "Rating trending up", icon: Star },
];

function ProfileSettingsPage() {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateMyProfile);
  const linkFn = useServerFn(linkCodeforcesHandle);
  const unlinkFn = useServerFn(unlinkCodeforcesHandle);

  const profileQuery = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const profile = profileQuery.data;

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [badges, setBadges] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setHandle(profile?.codeforces_handle ?? "");
    setBadges(
      (profile as { public_badges?: string[] } | null | undefined)?.public_badges ?? [],
    );
  }, [profile?.display_name, profile?.codeforces_handle, profile]);

  const saveName = useMutation({
    mutationFn: (name: string) => updateFn({ data: { display_name: name } }),
    onSuccess: () => {
      toast.success("Display name saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const saveBadges = useMutation({
    mutationFn: (next: string[]) => updateFn({ data: { public_badges: next } }),
    onSuccess: () => {
      toast.success("Public badges updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const linkMut = useMutation({
    mutationFn: (h: string) => linkFn({ data: { handle: h } }),
    onSuccess: () => {
      toast.success("Codeforces handle linked");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Link failed"),
  });

  const unlinkMut = useMutation({
    mutationFn: () => unlinkFn({}),
    onSuccess: () => {
      toast.success("Codeforces handle unlinked");
      setHandle("");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Unlink failed"),
  });

  const onPickFile = () => fileInput.current?.click();

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      toast.error("Use a PNG, JPG, WEBP, or GIF image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB.");
      return;
    }
    setUploading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Please sign in again.");
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${userData.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      await updateFn({ data: { avatar_url: path } });
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      notifyProfileUpdated();
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await updateFn({ data: { avatar_url: null } });
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      notifyProfileUpdated();
      toast.success("Avatar removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const toggleBadge = (id: string) => {
    setBadges((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const badgesDirty = (() => {
    const current =
      (profile as { public_badges?: string[] } | null | undefined)?.public_badges ?? [];
    if (current.length !== badges.length) return true;
    const a = [...current].sort();
    const b = [...badges].sort();
    return a.some((v, i) => v !== b[i]);
  })();

  const avatarUrl = profile?.avatar_signed_url ?? profile?.cf_title_photo ?? undefined;
  const initial = (profile?.display_name ?? profile?.codeforces_handle ?? "?").charAt(0).toUpperCase();
  const linked = Boolean(profile?.codeforces_handle);

  return (
    <AppShell
      breadcrumb={[
        { label: "Profile", to: "/profile" },
        { label: "Settings" },
      ]}
    >
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-6 sm:px-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profile settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage how you appear across Verdiqy and on your public profile.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/profile">
              View public profile
              <ExternalLink className="ml-1 size-3.5" />
            </Link>
          </Button>
        </header>

        {/* Avatar */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Avatar</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shown on your profile, comments, and leaderboards.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Avatar className="size-20">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-xl">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={onFile}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onPickFile} disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                  {uploading ? "Uploading…" : "Upload photo"}
                </Button>
                {profile?.avatar_url ? (
                  <Button size="sm" variant="ghost" onClick={removeAvatar} disabled={uploading}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-2xs text-muted-foreground">PNG, JPG, WEBP, or GIF · up to 4 MB</p>
            </div>
          </div>
        </section>

        {/* Display name */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Display name</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How your name appears across the app.
          </p>
          <div className="mt-4 flex gap-2">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
              placeholder="How should we call you?"
            />
            <Button
              onClick={() => saveName.mutate(displayName.trim())}
              disabled={
                saveName.isPending ||
                !displayName.trim() ||
                displayName.trim() === (profile?.display_name ?? "")
              }
            >
              {saveName.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
            </Button>
          </div>
        </section>

        {/* Codeforces handle */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Codeforces handle</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Link your Codeforces account to sync rating, rank, and submissions.
              </p>
            </div>
            {linked ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="size-3" /> Linked
              </Badge>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              maxLength={40}
              placeholder="e.g. tourist"
            />
            <Button
              onClick={() => linkMut.mutate(handle.trim())}
              disabled={linkMut.isPending || !handle.trim() || handle.trim() === (profile?.codeforces_handle ?? "")}
            >
              {linkMut.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : linked ? (
                "Re-link"
              ) : (
                "Link"
              )}
            </Button>
            {linked ? (
              <Button
                variant="outline"
                onClick={() => unlinkMut.mutate()}
                disabled={unlinkMut.isPending}
                title="Unlink handle"
              >
                {unlinkMut.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Unlink className="size-3.5" />
                )}
              </Button>
            ) : null}
          </div>
          {profile?.cf_rating != null ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Current rating: <span className="font-medium text-foreground tabular-nums">{profile.cf_rating}</span>
              {profile.cf_rank ? ` · ${profile.cf_rank}` : ""}
            </p>
          ) : null}
        </section>

        {/* Public badges */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Public badges</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pick which badges appear on your public profile. Others stay hidden.
              </p>
            </div>
            <p className="text-2xs tabular-nums text-muted-foreground">
              {badges.length}/{BADGE_OPTIONS.length}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BADGE_OPTIONS.map((opt) => {
              const active = badges.includes(opt.id);
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleBadge(opt.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-start gap-3 rounded-md border p-3 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:bg-surface-muted",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 shrink-0 place-items-center rounded-md",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium">{opt.label}</span>
                      {active ? (
                        <CheckCircle2 className="size-3.5 text-primary" aria-hidden />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {opt.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() =>
                setBadges(
                  (profile as { public_badges?: string[] } | null | undefined)?.public_badges ?? [],
                )
              }
              disabled={!badgesDirty || saveBadges.isPending}
            >
              Reset
            </Button>
            <Button
              onClick={() => saveBadges.mutate(badges)}
              disabled={!badgesDirty || saveBadges.isPending}
            >
              {saveBadges.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Save badges"
              )}
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
