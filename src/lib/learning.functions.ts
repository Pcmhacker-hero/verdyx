import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Types returned to the UI ----

export interface RecommendedProblem {
  id: string;
  cf_contest_id: number;
  cf_index: string;
  name: string;
  rating: number | null;
  tags: string[];
  url: string;
}

export interface DashboardData {
  profile: {
    id: string;
    display_name: string | null;
    codeforces_handle: string | null;
    target_rating: number;
    current_streak: number;
    onboarded: boolean;
  };
  activeRecommendation: {
    id: string;
    rationale: string | null;
    focus_topic: string | null;
    est_minutes: number | null;
    problem: RecommendedProblem;
  } | null;
  weakTopics: Array<{ topic: string; score: number; confidence: number }>;
  todaySolvedCount: number;
  totalSolvedCount: number;
  coachNote: string | null;
}

// ---- Dashboard ----

export const getTodayDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Ensure profile exists (trigger normally creates it, but be defensive)
    let { data: profile } = await context.supabase
      .from("profiles")
      .select("id, display_name, codeforces_handle, target_rating, current_streak, onboarded")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile) {
      await supabaseAdmin.from("profiles").insert({ id: context.userId });
      const res = await context.supabase
        .from("profiles")
        .select("id, display_name, codeforces_handle, target_rating, current_streak, onboarded")
        .eq("id", context.userId)
        .maybeSingle();
      profile = res.data;
    }

    // Weak topics
    const { data: masteryRows } = await context.supabase
      .from("topic_mastery")
      .select("topic, score, confidence")
      .eq("user_id", context.userId)
      .gte("confidence", 2)
      .order("score", { ascending: true })
      .limit(5);
    const weakTopics = (masteryRows ?? []).map((m) => ({
      topic: m.topic,
      score: Number(m.score),
      confidence: m.confidence,
    }));

    // Solved counts
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todaySolvedCount } = await context.supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("verdict", "OK")
      .gte("solved_at", todayStart.toISOString());
    const { count: totalSolvedCount } = await context.supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("verdict", "OK");

    // Active recommendation (join problem)
    const { data: rec } = await context.supabase
      .from("recommendations")
      .select(
        "id, rationale, focus_topic, est_minutes, problem:problems (id, cf_contest_id, cf_index, name, rating, tags, url)",
      )
      .eq("user_id", context.userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Today's coach note
    const today = new Date().toISOString().slice(0, 10);
    const { data: plan } = await context.supabase
      .from("daily_plans")
      .select("coach_note")
      .eq("user_id", context.userId)
      .eq("plan_date", today)
      .maybeSingle();

    return {
      profile: profile ?? {
        id: context.userId,
        display_name: null,
        codeforces_handle: null,
        target_rating: 1400,
        current_streak: 0,
        onboarded: false,
      },
      activeRecommendation: rec?.problem
        ? {
            id: rec.id,
            rationale: rec.rationale,
            focus_topic: rec.focus_topic,
            est_minutes: rec.est_minutes,
            problem: rec.problem as unknown as RecommendedProblem,
          }
        : null,
      weakTopics,
      todaySolvedCount: todaySolvedCount ?? 0,
      totalSolvedCount: totalSolvedCount ?? 0,
      coachNote: plan?.coach_note ?? null,
    };
  });

// ---- Recommend next problem ----

interface AIRecommendationPick {
  problem_id: string;
  rationale: string;
  focus_topic: string;
  est_minutes: number;
}

export const recommendNext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { callLovableAI, tryParseJSON } = await import("./ai-gateway.server");

    // Ensure problems catalog has data — lazy sync on first use.
    const { count: pCount } = await supabaseAdmin
      .from("problems")
      .select("*", { count: "exact", head: true });
    if (!pCount || pCount < 100) {
      const { syncProblemsetCore } = await import("./sync.server");
      await syncProblemsetCore(true);
    }

    // Retire any existing active recommendations
    await context.supabase
      .from("recommendations")
      .update({ status: "stale", resolved_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("status", "active");

    // Load profile
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("target_rating, codeforces_handle")
      .eq("id", context.userId)
      .maybeSingle();
    const target = profile?.target_rating ?? 1400;

    // Solved problem ids (avoid recommending)
    const { data: solved } = await context.supabase
      .from("submissions")
      .select("problem_id")
      .eq("user_id", context.userId)
      .eq("verdict", "OK");
    const solvedIds = new Set((solved ?? []).map((s) => s.problem_id).filter(Boolean) as string[]);

    // Weak topics (bias candidates)
    const { data: masteryRows } = await context.supabase
      .from("topic_mastery")
      .select("topic, score, confidence")
      .eq("user_id", context.userId)
      .order("score", { ascending: true })
      .limit(5);
    const weakTopics = (masteryRows ?? []).filter((m) => m.confidence >= 1).map((m) => m.topic);

    // Recent 15 submissions summary
    const { data: recent } = await context.supabase
      .from("submissions")
      .select("verdict, cf_contest_id, cf_index, solved_at")
      .eq("user_id", context.userId)
      .order("solved_at", { ascending: false })
      .limit(15);

    // Build candidate pool: rating within [target-200, target+100]
    const minR = Math.max(800, target - 200);
    const maxR = Math.min(3500, target + 100);
    let candidatesQ = supabaseAdmin
      .from("problems")
      .select("id, cf_contest_id, cf_index, name, rating, tags, url")
      .gte("rating", minR)
      .lte("rating", maxR)
      .limit(60);
    if (weakTopics.length) candidatesQ = candidatesQ.overlaps("tags", weakTopics);
    let { data: candidates } = await candidatesQ;

    // Fallback: no weak-topic match
    if (!candidates || candidates.length < 5) {
      const res = await supabaseAdmin
        .from("problems")
        .select("id, cf_contest_id, cf_index, name, rating, tags, url")
        .gte("rating", minR)
        .lte("rating", maxR)
        .limit(60);
      candidates = res.data ?? [];
    }

    // Drop already-solved
    candidates = candidates.filter((c) => !solvedIds.has(c.id));
    if (!candidates.length) {
      // Widen the net
      const res = await supabaseAdmin
        .from("problems")
        .select("id, cf_contest_id, cf_index, name, rating, tags, url")
        .gte("rating", Math.max(800, target - 400))
        .lte("rating", Math.min(3500, target + 200))
        .limit(80);
      candidates = (res.data ?? []).filter((c) => !solvedIds.has(c.id));
    }
    if (!candidates.length) throw new Error("No unseen problems in your range — try syncing more.");

    // Sample down to 25 for prompt cost
    const sampled = candidates.sort(() => Math.random() - 0.5).slice(0, 25);

    // ---- Ask the model ----
    const system = [
      "You are an elite competitive-programming coach.",
      "Pick exactly ONE problem from the candidates that maximises the user's rating growth right now.",
      "Prefer problems that stretch weak topics but are still solvable in one sitting.",
      "Return ONLY valid JSON matching: {\"problem_id\":\"<uuid from candidates>\",\"rationale\":\"<1-2 sentences, second person>\",\"focus_topic\":\"<one tag from the chosen problem>\",\"est_minutes\":<integer 15-60>}",
      "Never invent a problem_id — copy one from the list exactly.",
    ].join(" ");

    const userMsg = JSON.stringify({
      target_rating: target,
      weak_topics: weakTopics,
      recent_submissions: (recent ?? []).map((r) => ({
        verdict: r.verdict,
        problem: `${r.cf_contest_id}${r.cf_index}`,
      })),
      candidates: sampled.map((c) => ({
        id: c.id,
        title: c.name,
        rating: c.rating,
        tags: c.tags,
      })),
    });

    let pick: AIRecommendationPick | null = null;
    try {
      const raw = await callLovableAI({ system, user: userMsg, json: true, temperature: 0.4 });
      pick = tryParseJSON<AIRecommendationPick>(raw);
    } catch (e) {
      console.error("[recommendNext] AI call failed", e);
    }

    const chosen = pick && sampled.find((s) => s.id === pick!.problem_id);
    const fallback = sampled[0]!;
    const problem = chosen ?? fallback;
    const rationale =
      pick?.rationale ?? "A problem in your target range to keep momentum — start with the observation about small cases.";
    const focusTopic = pick?.focus_topic ?? problem.tags[0] ?? null;
    const estMinutes = pick?.est_minutes ?? 30;

    const { data: inserted, error } = await supabaseAdmin
      .from("recommendations")
      .insert({
        user_id: context.userId,
        problem_id: problem.id,
        status: "active",
        rationale,
        focus_topic: focusTopic,
        est_minutes: estMinutes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { recommendationId: inserted.id, problemId: problem.id };
  });

// ---- Record an attempt outcome ----

export const recordAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const d = raw as { recommendationId?: string; outcome?: "solved" | "skipped" | "too_hard"; attempts?: number };
    if (!d?.recommendationId || typeof d.recommendationId !== "string") {
      throw new Error("recommendationId required");
    }
    if (!["solved", "skipped", "too_hard"].includes(d.outcome ?? "")) {
      throw new Error("outcome must be solved|skipped|too_hard");
    }
    return {
      recommendationId: d.recommendationId,
      outcome: d.outcome as "solved" | "skipped" | "too_hard",
      attempts: Math.max(1, Math.min(20, Number(d.attempts) || 1)),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { updateMasteryScore } = await import("./mastery.server");

    // Load recommendation + problem
    const { data: rec } = await context.supabase
      .from("recommendations")
      .select("id, problem_id, status")
      .eq("id", data.recommendationId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!rec) throw new Error("Recommendation not found");

    const { data: prob } = await context.supabase
      .from("problems")
      .select("cf_contest_id, cf_index, tags")
      .eq("id", rec.problem_id)
      .maybeSingle();
    if (!prob) throw new Error("Problem missing");

    const verdict = data.outcome === "solved" ? "OK" : data.outcome === "too_hard" ? "TOO_HARD" : "SKIPPED";
    const outcomeScore = data.outcome === "solved" ? 1 : 0;

    // Insert submission
    await supabaseAdmin.from("submissions").insert({
      user_id: context.userId,
      problem_id: rec.problem_id,
      cf_contest_id: prob.cf_contest_id,
      cf_index: prob.cf_index,
      verdict,
      attempts: data.attempts,
      source: "manual",
    });

    // Update mastery for each tag
    const { data: masteryRows } = await supabaseAdmin
      .from("topic_mastery")
      .select("topic, score, confidence")
      .eq("user_id", context.userId)
      .in("topic", prob.tags.length ? prob.tags : ["__none__"]);
    const map = new Map<string, { score: number; confidence: number }>();
    for (const m of masteryRows ?? [])
      map.set(m.topic, { score: Number(m.score), confidence: m.confidence });

    const upserts = prob.tags.map((tag) => {
      const prev = map.get(tag) ?? { score: 0.5, confidence: 0 };
      return {
        user_id: context.userId,
        topic: tag,
        score: updateMasteryScore(prev.score, outcomeScore),
        confidence: prev.confidence + 1,
        updated_at: new Date().toISOString(),
      };
    });
    if (upserts.length) {
      await supabaseAdmin
        .from("topic_mastery")
        .upsert(upserts, { onConflict: "user_id,topic" });
    }

    // Resolve recommendation
    await supabaseAdmin
      .from("recommendations")
      .update({
        status: data.outcome === "solved" ? "solved" : data.outcome,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", rec.id);

    // Streak bump on solve
    if (data.outcome === "solved") {
      const today = new Date().toISOString().slice(0, 10);
      const { data: p } = await context.supabase
        .from("profiles")
        .select("current_streak, last_active_date")
        .eq("id", context.userId)
        .maybeSingle();
      let streak = p?.current_streak ?? 0;
      if (p?.last_active_date !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yestStr = yesterday.toISOString().slice(0, 10);
        streak = p?.last_active_date === yestStr ? streak + 1 : 1;
        await supabaseAdmin
          .from("profiles")
          .update({ current_streak: streak, last_active_date: today })
          .eq("id", context.userId);
      }
    }

    return { ok: true };
  });

// ---- Coach note ----

export const generateCoachNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { callLovableAI } = await import("./ai-gateway.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await context.supabase
      .from("daily_plans")
      .select("coach_note")
      .eq("user_id", context.userId)
      .eq("plan_date", today)
      .maybeSingle();
    if (existing?.coach_note) return { note: existing.coach_note };

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("target_rating, current_streak")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: mastery } = await context.supabase
      .from("topic_mastery")
      .select("topic, score, confidence")
      .eq("user_id", context.userId)
      .gte("confidence", 2)
      .order("score", { ascending: true })
      .limit(3);

    const prompt = JSON.stringify({
      target_rating: profile?.target_rating ?? 1400,
      streak: profile?.current_streak ?? 0,
      weakest_topics: (mastery ?? []).map((m) => ({ topic: m.topic, score: Number(m.score) })),
    });

    let note = "Focus on one problem at a time. Read once, plan for 60 seconds, then code.";
    try {
      note = await callLovableAI({
        system:
          "You are a warm, precise CP coach. In 2 short sentences (max 220 chars), tell the user what to focus on today given their weak topics and streak. Second person, present tense, no emojis, no lists.",
        user: prompt,
        temperature: 0.7,
      });
      note = note.trim().slice(0, 280);
    } catch (e) {
      console.error("[coachNote] AI failed", e);
    }

    await supabaseAdmin
      .from("daily_plans")
      .upsert(
        { user_id: context.userId, plan_date: today, coach_note: note },
        { onConflict: "user_id,plan_date" },
      );
    return { note };
  });
