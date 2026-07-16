import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TaskKind = "warmup" | "focus" | "weak_topic" | "contest_prep" | "review";
export type TaskStatus = "active" | "solved" | "skipped" | "too_hard" | "stale" | "pending";

export interface SessionProblem {
  id: string;
  cf_contest_id: number;
  cf_index: string;
  name: string;
  rating: number | null;
  tags: string[];
  url: string;
}

export interface SessionTask {
  id: string;
  position: number;
  kind: TaskKind;
  status: TaskStatus;
  focus_topic: string | null;
  rationale: string | null;
  est_minutes: number | null;
  xp_reward: number;
  ai_feedback: string | null;
  reviewed_at: string | null;
  problem: SessionProblem;
}

export interface SessionState {
  plan: {
    id: string;
    plan_date: string;
    status: "not_started" | "in_progress" | "completed";
    task_count: number;
    xp_earned: number;
    coach_note: string | null;
    ai_summary: string | null;
    started_at: string | null;
    completed_at: string | null;
  } | null;
  tasks: SessionTask[];
  currentTask: SessionTask | null;
  completedCount: number;
  profile: {
    id: string;
    display_name: string | null;
    codeforces_handle: string | null;
    target_rating: number;
    current_streak: number;
    onboarded: boolean;
    timezone: string;
  };
  weakTopics: Array<{ topic: string; score: number }>;
  totalSolvedCount: number;
}

const KIND_LABELS: Record<TaskKind, { label: string; xp: number; ratingOffset: [number, number] }> = {
  warmup: { label: "warmup", xp: 40, ratingOffset: [-300, -100] },
  focus: { label: "focus", xp: 120, ratingOffset: [-100, 100] },
  weak_topic: { label: "weak_topic", xp: 100, ratingOffset: [-150, 0] },
  contest_prep: { label: "contest_prep", xp: 200, ratingOffset: [0, 200] },
  review: { label: "review", xp: 60, ratingOffset: [-200, -50] },
};

/**
 * P0-#6 fix — timezone-safe "today".
 *
 * Previous version returned UTC yyyy-mm-dd, so a user finishing at 8 PM in
 * UTC-8 was rolled onto the next day and lost their streak. We now format
 * `now` in the user's IANA timezone and slice out yyyy-mm-dd.
 *
 * Falls back to UTC if the timezone string is missing/invalid.
 */
function todayStr(timezone?: string | null): string {
  const tz = timezone && timezone.trim() ? timezone : "UTC";
  try {
    // en-CA gives ISO-ish yyyy-mm-dd which we can consume directly.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** P0-#6 helper — yesterday in the user's timezone, for streak continuity. */
function yesterdayStr(timezone?: string | null): string {
  const tz = timezone && timezone.trim() ? timezone : "UTC";
  const y = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(y);
  } catch {
    return y.toISOString().slice(0, 10);
  }
}

async function loadProfile(ctxSupabase: any, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let { data: profile } = await ctxSupabase
    .from("profiles")
    .select("id, display_name, codeforces_handle, target_rating, current_streak, onboarded, timezone")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) {
    await supabaseAdmin.from("profiles").insert({ id: userId });
    const res = await ctxSupabase
      .from("profiles")
      .select("id, display_name, codeforces_handle, target_rating, current_streak, onboarded, timezone")
      .eq("id", userId)
      .maybeSingle();
    profile = res.data;
  }
  return (
    profile ?? {
      id: userId,
      display_name: null,
      codeforces_handle: null,
      target_rating: 1400,
      current_streak: 0,
      onboarded: false,
      timezone: "UTC",
    }
  );
}

async function buildStateResponse(ctxSupabase: any, userId: string): Promise<SessionState> {
  const profile = await loadProfile(ctxSupabase, userId);
  const today = todayStr(profile.timezone);

  const { data: plan } = await ctxSupabase
    .from("daily_plans")
    .select("id, plan_date, status, task_count, xp_earned, coach_note, ai_summary, started_at, completed_at")
    .eq("user_id", userId)
    .eq("plan_date", today)
    .maybeSingle();

  let tasks: SessionTask[] = [];
  if (plan) {
    const { data: recs } = await ctxSupabase
      .from("recommendations")
      .select(
        "id, position, kind, status, focus_topic, rationale, est_minutes, xp_reward, ai_feedback, reviewed_at, problem:problems(id, cf_contest_id, cf_index, name, rating, tags, url)",
      )
      .eq("user_id", userId)
      .eq("plan_id", plan.id)
      .order("position", { ascending: true });
    tasks = (recs ?? [])
      .filter((r: any) => r.problem)
      .map((r: any) => ({
        id: r.id,
        position: r.position,
        kind: r.kind as TaskKind,
        status: r.status as TaskStatus,
        focus_topic: r.focus_topic,
        rationale: r.rationale,
        est_minutes: r.est_minutes,
        xp_reward: r.xp_reward,
        ai_feedback: r.ai_feedback,
        reviewed_at: r.reviewed_at,
        problem: r.problem as SessionProblem,
      }));
  }

  // "completed" means anything other than active/pending (solved/skipped/too_hard/stale).
  const completedCount = tasks.filter(
    (t) => t.status !== "active" && t.status !== "pending",
  ).length;
  const currentTask = tasks.find((t) => t.status === "active") ?? null;

  const { data: masteryRows } = await ctxSupabase
    .from("topic_mastery")
    .select("topic, score, confidence")
    .eq("user_id", userId)
    .order("score", { ascending: true })
    .limit(5);
  const weakTopics = (masteryRows ?? []).map((m: any) => ({
    topic: m.topic,
    score: Number(m.score),
  }));

  const { count: totalSolvedCount } = await ctxSupabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("verdict", "OK");

  return {
    plan: plan
      ? {
          id: plan.id,
          plan_date: plan.plan_date,
          status: (plan.status as "not_started" | "in_progress" | "completed") ?? "not_started",
          task_count: plan.task_count,
          xp_earned: plan.xp_earned,
          coach_note: plan.coach_note,
          ai_summary: plan.ai_summary,
          started_at: plan.started_at,
          completed_at: plan.completed_at,
        }
      : null,
    tasks,
    currentTask,
    completedCount,
    profile,
    weakTopics,
    totalSolvedCount: totalSolvedCount ?? 0,
  };
}

export const getSessionState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => buildStateResponse(context.supabase, context.userId));

// ---- Start today's session ----

export const startTodaySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { callLovableAI } = await import("./ai-gateway.server");

    const profile = await loadProfile(context.supabase, context.userId);
    const today = todayStr(profile.timezone);

    // P0-#3 fix — idempotency.
    // Previously: SELECT plan → INSERT if missing. Two concurrent calls (double-click,
    // two tabs, retried mutation) both saw "missing" and both tried to insert.
    // Now: rely on the existing UNIQUE(user_id, plan_date) constraint via UPSERT,
    // and no-op when a plan for today is already past the "not_started" phase.
    const { data: existingPlan } = await context.supabase
      .from("daily_plans")
      .select("id, status")
      .eq("user_id", context.userId)
      .eq("plan_date", today)
      .maybeSingle();

    if (existingPlan && existingPlan.status !== "not_started") {
      // Already in progress or completed — return current state, do not regenerate.
      return buildStateResponse(context.supabase, context.userId);
    }

    // Ensure problems catalog exists. If sync fails, we still fall through
    // to picks logic below which will throw a clean error (see P0-#4).
    const { count: pCount } = await supabaseAdmin
      .from("problems")
      .select("*", { count: "exact", head: true });
    if (!pCount || pCount < 100) {
      try {
        const { syncProblemsetCore } = await import("./sync.server");
        await syncProblemsetCore(true);
      } catch (e) {
        console.error("[startSession] problemset sync failed", e);
      }
    }

    const target = profile.target_rating ?? 1400;

    const { data: solved } = await context.supabase
      .from("submissions")
      .select("problem_id")
      .eq("user_id", context.userId)
      .eq("verdict", "OK");
    const solvedIds = new Set(
      (solved ?? []).map((s: any) => s.problem_id).filter(Boolean) as string[],
    );

    const { data: masteryRows } = await context.supabase
      .from("topic_mastery")
      .select("topic, score, confidence")
      .eq("user_id", context.userId)
      .order("score", { ascending: true })
      .limit(3);
    const weakTopics = (masteryRows ?? [])
      .filter((m: any) => m.confidence >= 1)
      .map((m: any) => m.topic);

    const kinds: TaskKind[] = ["warmup", "focus", "weak_topic", "contest_prep"];
    const picks: Array<{
      kind: TaskKind;
      problem: any;
      focus_topic: string | null;
      rationale: string;
      est_minutes: number;
      xp_reward: number;
    }> = [];
    const usedIds = new Set<string>();

    for (const kind of kinds) {
      const spec = KIND_LABELS[kind];
      const minR = Math.max(800, target + spec.ratingOffset[0]);
      const maxR = Math.min(3500, target + spec.ratingOffset[1]);

      let q = supabaseAdmin
        .from("problems")
        .select("id, cf_contest_id, cf_index, name, rating, tags, url")
        .gte("rating", minR)
        .lte("rating", maxR)
        .limit(40);
      if (kind === "weak_topic" && weakTopics.length) {
        q = q.overlaps("tags", weakTopics);
      }
      let { data: pool } = await q;
      pool = (pool ?? []).filter((p: any) => !solvedIds.has(p.id) && !usedIds.has(p.id));

      if (!pool.length) {
        const res = await supabaseAdmin
          .from("problems")
          .select("id, cf_contest_id, cf_index, name, rating, tags, url")
          .gte("rating", Math.max(800, target - 400))
          .lte("rating", Math.min(3500, target + 300))
          .limit(60);
        pool = (res.data ?? []).filter(
          (p: any) => !solvedIds.has(p.id) && !usedIds.has(p.id),
        );
      }
      if (!pool.length) continue;

      const chosen = pool[Math.floor(Math.random() * pool.length)];
      usedIds.add(chosen.id);
      const focusTopic =
        kind === "weak_topic" && weakTopics.length
          ? chosen.tags.find((t: string) => weakTopics.includes(t)) ?? chosen.tags[0]
          : chosen.tags[0] ?? null;
      picks.push({
        kind,
        problem: chosen,
        focus_topic: focusTopic,
        rationale:
          kind === "warmup"
            ? "Loosen up with a quick pattern you already know — pace yourself."
            : kind === "focus"
              ? "Your main problem today, sized to your rating. Take your time and think first."
              : kind === "weak_topic"
                ? "This targets a topic where your accuracy is low — the biggest rating leverage."
                : "A stretch problem to prep you for real contest pressure.",
        est_minutes: kind === "warmup" ? 15 : kind === "contest_prep" ? 45 : 25,
        xp_reward: spec.xp,
      });
    }

    // P0-#4 fix — refuse to create a session with zero tasks.
    // Previously the plan row was inserted anyway, leaving the UI stuck in
    // "problem" view with nothing to render (`data.currentTask` undefined).
    if (picks.length === 0) {
      throw new Error(
        "We couldn't build a session — the problem library is still warming up. Please try again in a minute.",
      );
    }

    // Optional coach note — non-fatal.
    let coachNote = "Focus on one problem at a time. Read once, plan for 60 seconds, then code.";
    try {
      const prompt = JSON.stringify({
        target_rating: target,
        streak: profile.current_streak ?? 0,
        weak_topics: weakTopics,
        tasks: picks.map((p) => ({
          kind: p.kind,
          name: p.problem.name,
          rating: p.problem.rating,
        })),
      });
      const raw = await callLovableAI({
        system:
          "You are a warm, precise CP coach. In 2 short sentences (max 220 chars), tell the user how to approach today's session. Second person, present tense, no emojis, no lists.",
        user: prompt,
        temperature: 0.7,
      });
      coachNote = raw.trim().slice(0, 280);
    } catch (e) {
      console.error("[startSession] coach note failed", e);
    }

    const nowIso = new Date().toISOString();
    const problemIds = picks.map((p) => p.problem.id);

    // P0-#3 fix — upsert against UNIQUE(user_id, plan_date). Even if two
    // requests race, only one row exists after this call.
    const { data: upserted, error: upsertErr } = await supabaseAdmin
      .from("daily_plans")
      .upsert(
        {
          user_id: context.userId,
          plan_date: today,
          status: "in_progress",
          task_count: picks.length,
          coach_note: coachNote,
          problem_ids: problemIds,
          started_at: nowIso,
        },
        { onConflict: "user_id,plan_date" },
      )
      .select("id")
      .single();
    if (upsertErr || !upserted) {
      throw new Error(upsertErr?.message ?? "Failed to create session");
    }
    const planId = upserted.id;

    // Wipe any recs from a previous attempt for THIS plan so we can re-seed
    // cleanly. Safe: we're about to insert fresh rows.
    await supabaseAdmin.from("recommendations").delete().eq("plan_id", planId);

    // P0-#14 (rolled into P0 here to prevent constraint violations):
    // Retire any active recs still hanging around for this user that are not
    // tied to today's plan — they can't coexist with our new active row under
    // the new `recommendations_one_active_per_plan` index.
    await supabaseAdmin
      .from("recommendations")
      .update({ status: "stale", resolved_at: nowIso })
      .eq("user_id", context.userId)
      .eq("status", "active")
      .neq("plan_id", planId);

    // Insert recs. Only position 0 starts "active" — the partial unique index
    // on (plan_id) WHERE status='active' guarantees no duplicate active rows.
    const rows = picks.map((p, i) => ({
      user_id: context.userId,
      plan_id: planId,
      problem_id: p.problem.id,
      status: i === 0 ? "active" : "pending",
      position: i,
      kind: p.kind,
      rationale: p.rationale,
      focus_topic: p.focus_topic,
      est_minutes: p.est_minutes,
      xp_reward: p.xp_reward,
    }));
    const { error: insErr } = await supabaseAdmin.from("recommendations").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return buildStateResponse(context.supabase, context.userId);
  });

// ---- Complete current task ----

export const completeTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const d = raw as { taskId?: string; outcome?: "solved" | "skipped" | "too_hard"; attempts?: number };
    if (!d?.taskId) throw new Error("taskId required");
    if (!["solved", "skipped", "too_hard"].includes(d.outcome ?? "")) {
      throw new Error("outcome required");
    }
    return {
      taskId: d.taskId,
      outcome: d.outcome as "solved" | "skipped" | "too_hard",
      attempts: Math.max(1, Math.min(20, Number(d.attempts) || 1)),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { callLovableAI } = await import("./ai-gateway.server");
    const { updateMasteryScore } = await import("./mastery.server");

    const { data: rec } = await context.supabase
      .from("recommendations")
      .select(
        "id, plan_id, problem_id, kind, status, focus_topic, xp_reward, ai_feedback, problem:problems(cf_contest_id, cf_index, name, rating, tags)",
      )
      .eq("id", data.taskId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!rec) throw new Error("Task not found");
    const prob = rec.problem as any;
    if (!prob) throw new Error("Problem missing");

    // P0-#1 fix (idempotency) — if this task was already resolved, return
    // current state instead of double-crediting XP / streak / mastery.
    if (rec.status && rec.status !== "active") {
      const state = await buildStateResponse(context.supabase, context.userId);
      return {
        xpEarned: 0,
        feedback:
          rec.ai_feedback ??
          "This task was already reviewed. Continue to your next problem.",
        state,
      };
    }

    const verdict =
      data.outcome === "solved" ? "OK" : data.outcome === "too_hard" ? "TOO_HARD" : "SKIPPED";
    const outcomeScore = data.outcome === "solved" ? 1 : 0;

    await supabaseAdmin.from("submissions").insert({
      user_id: context.userId,
      problem_id: rec.problem_id,
      cf_contest_id: prob.cf_contest_id,
      cf_index: prob.cf_index,
      verdict,
      attempts: data.attempts,
      source: "manual",
    });

    const tagList = (prob.tags ?? []) as string[];
    if (tagList.length) {
      const { data: masteryRows } = await supabaseAdmin
        .from("topic_mastery")
        .select("topic, score, confidence")
        .eq("user_id", context.userId)
        .in("topic", tagList);
      const map = new Map<string, { score: number; confidence: number }>();
      for (const m of masteryRows ?? [])
        map.set(m.topic, { score: Number(m.score), confidence: m.confidence });
      const upserts = tagList.map((tag: string) => {
        const prev = map.get(tag) ?? { score: 0.5, confidence: 0 };
        return {
          user_id: context.userId,
          topic: tag,
          score: updateMasteryScore(prev.score, outcomeScore),
          confidence: prev.confidence + 1,
          updated_at: new Date().toISOString(),
        };
      });
      await supabaseAdmin.from("topic_mastery").upsert(upserts, { onConflict: "user_id,topic" });
    }

    let feedback = "";
    try {
      const prompt = JSON.stringify({
        problem: prob.name,
        rating: prob.rating,
        tags: prob.tags,
        outcome: data.outcome,
        attempts: data.attempts,
        kind: rec.kind,
      });
      const raw = await callLovableAI({
        system:
          "You are a supportive CP coach reviewing one attempt. In 2-3 sentences, tell the user what this attempt shows about their skills, and one concrete thing to remember for next time. Second person, warm, no emojis, no lists, max 320 chars.",
        user: prompt,
        temperature: 0.6,
      });
      feedback = raw.trim().slice(0, 400);
    } catch (e) {
      console.error("[completeTask] AI feedback failed", e);
      feedback =
        data.outcome === "solved"
          ? "Nice work — lock in the pattern you used and move on."
          : "No worries — mark the trick you were missing and keep going.";
    }

    const xpEarned = data.outcome === "solved" ? rec.xp_reward : Math.round(rec.xp_reward * 0.25);
    const nowIso = new Date().toISOString();

    // Resolve current rec — this frees up the partial-unique "active" slot
    // for the next task (see P0-#1).
    await supabaseAdmin
      .from("recommendations")
      .update({
        status: data.outcome === "solved" ? "solved" : data.outcome,
        resolved_at: nowIso,
        ai_feedback: feedback,
        reviewed_at: nowIso,
      })
      .eq("id", rec.id);

    if (rec.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from("daily_plans")
        .select("xp_earned")
        .eq("id", rec.plan_id)
        .maybeSingle();
      const newXp = (plan?.xp_earned ?? 0) + xpEarned;
      await supabaseAdmin
        .from("daily_plans")
        .update({ xp_earned: newXp })
        .eq("id", rec.plan_id);
    }

    // Streak bump on solve — P0-#6 timezone-safe.
    if (data.outcome === "solved") {
      const profile = await loadProfile(context.supabase, context.userId);
      const today = todayStr(profile.timezone);
      const yesterday = yesterdayStr(profile.timezone);
      const { data: p } = await context.supabase
        .from("profiles")
        .select("current_streak, last_active_date")
        .eq("id", context.userId)
        .maybeSingle();
      if (p?.last_active_date !== today) {
        const streak =
          p?.last_active_date === yesterday ? (p?.current_streak ?? 0) + 1 : 1;
        await supabaseAdmin
          .from("profiles")
          .update({ current_streak: streak, last_active_date: today })
          .eq("id", context.userId);
      }
    }

    const state = await buildStateResponse(context.supabase, context.userId);
    return { xpEarned, feedback, state };
  });

// ---- Advance to next task ----

export const advanceToNextTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profile = await loadProfile(context.supabase, context.userId);
    const today = todayStr(profile.timezone);

    const { data: plan } = await context.supabase
      .from("daily_plans")
      .select("id, status")
      .eq("user_id", context.userId)
      .eq("plan_date", today)
      .maybeSingle();
    if (!plan) throw new Error("No session today");

    // P0-#1 fix — never create a second active row.
    // Read the WHOLE ordered rec list once so we can (a) find the highest
    // position that is already resolved/active, and (b) find the next candidate
    // strictly *after* it. Previously we only looked at status='pending', which
    // stranded sessions when a task was still 'active' or when order was
    // ambiguous.
    const { data: allRecs } = await supabaseAdmin
      .from("recommendations")
      .select("id, position, status")
      .eq("plan_id", plan.id)
      .order("position", { ascending: true });

    const recs = allRecs ?? [];
    const activeRec = recs.find((r: any) => r.status === "active");
    const nowIso = new Date().toISOString();

    // If a task is still active when advance is called, treat it as skipped
    // so we don't leave a stale active row blocking the unique index. This
    // matches the user intent of "move on".
    if (activeRec) {
      await supabaseAdmin
        .from("recommendations")
        .update({ status: "skipped", resolved_at: nowIso })
        .eq("id", activeRec.id);
    }

    // Next candidate = lowest-position rec still in a startable state,
    // strictly after the last resolved/active task.
    const cursor = activeRec
      ? activeRec.position
      : Math.max(
          -1,
          ...recs
            .filter((r: any) => r.status !== "pending")
            .map((r: any) => r.position),
        );
    const next = recs.find(
      (r: any) => r.status === "pending" && r.position > cursor,
    );

    if (next) {
      // Promote next → active. The partial unique index guarantees at most
      // one active row per plan; the update above already vacated the slot.
      const { error: promoteErr } = await supabaseAdmin
        .from("recommendations")
        .update({ status: "active" })
        .eq("id", next.id);
      if (promoteErr) {
        console.error("[advance] promote failed", promoteErr);
        throw new Error("Couldn't advance to the next task. Please refresh.");
      }
    } else {
      // No more tasks — finalize the session.
      const { callLovableAI } = await import("./ai-gateway.server");
      const { data: finalRecs } = await supabaseAdmin
        .from("recommendations")
        .select("kind, status, problem:problems(name, rating, tags)")
        .eq("plan_id", plan.id)
        .order("position", { ascending: true });
      let summary = "Great session — consistency compounds. See you tomorrow.";
      try {
        const prompt = JSON.stringify({
          results: (finalRecs ?? []).map((r: any) => ({
            kind: r.kind,
            status: r.status,
            name: r.problem?.name,
            rating: r.problem?.rating,
          })),
        });
        const raw = await callLovableAI({
          system:
            "You are a CP coach recapping today's session in 2-3 sentences. Highlight what went well, one growth area, and what to focus on tomorrow. Second person, no emojis, no lists, max 360 chars.",
          user: prompt,
          temperature: 0.6,
        });
        summary = raw.trim().slice(0, 400);
      } catch (e) {
        console.error("[advance] summary failed", e);
      }
      await supabaseAdmin
        .from("daily_plans")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          ai_summary: summary,
        })
        .eq("id", plan.id);
    }

    return buildStateResponse(context.supabase, context.userId);
  });
