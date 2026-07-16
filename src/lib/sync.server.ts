// Core sync implementations, callable from any server context (server fns or other server files).

import { fetchProblemset, fetchUserStatus } from "./codeforces.server";
import { updateMasteryScore } from "./mastery.server";

const FRESH_MS = 24 * 3600 * 1000;

export async function syncProblemsetCore(force = false): Promise<{
  synced: boolean;
  count?: number;
  reason?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: latest } = await supabaseAdmin
    .from("problems")
    .select("synced_at")
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!force && latest && Date.now() - new Date(latest.synced_at).getTime() < FRESH_MS) {
    return { synced: false, reason: "fresh" };
  }

  const problems = await fetchProblemset();
  const rows = problems
    .filter((p) => p.contestId && p.rating && p.rating >= 800 && p.rating <= 3500)
    .map((p) => ({
      cf_contest_id: p.contestId!,
      cf_index: p.index,
      name: p.name,
      rating: p.rating!,
      tags: p.tags,
      url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      synced_at: new Date().toISOString(),
    }));

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabaseAdmin
      .from("problems")
      .upsert(rows.slice(i, i + 500), { onConflict: "cf_contest_id,cf_index" });
    if (error) throw new Error(error.message);
  }
  return { synced: true, count: rows.length };
}

export async function syncUserSubmissionsCore(
  userId: string,
  handle: string,
): Promise<{ synced: number; error?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let submissions;
  try {
    submissions = await fetchUserStatus(handle, 200);
  } catch (e) {
    return { synced: 0, error: (e as Error).message };
  }

  const { data: existing } = await supabaseAdmin
    .from("submissions")
    .select("cf_contest_id, cf_index, verdict")
    .eq("user_id", userId)
    .eq("source", "codeforces");
  const seen = new Set(
    (existing ?? []).map((s) => `${s.cf_contest_id}:${s.cf_index}:${s.verdict}`),
  );

  const uniqCids = Array.from(
    new Set(submissions.map((s) => s.problem.contestId).filter(Boolean)),
  ) as number[];
  const { data: problemRows } = await supabaseAdmin
    .from("problems")
    .select("id, cf_contest_id, cf_index")
    .in("cf_contest_id", uniqCids.length ? uniqCids : [-1]);
  const problemMap = new Map<string, string>();
  for (const p of problemRows ?? []) problemMap.set(`${p.cf_contest_id}:${p.cf_index}`, p.id);

  const inserts: Array<{
    user_id: string;
    problem_id: string | null;
    cf_contest_id: number;
    cf_index: string;
    verdict: string;
    source: string;
    solved_at: string;
  }> = [];
  const topicOutcomes = new Map<string, number[]>();

  for (const s of submissions) {
    const cid = s.problem.contestId;
    if (!cid) continue;
    const key = `${cid}:${s.problem.index}:${s.verdict ?? "UNKNOWN"}`;
    if (seen.has(key)) continue;
    inserts.push({
      user_id: userId,
      problem_id: problemMap.get(`${cid}:${s.problem.index}`) ?? null,
      cf_contest_id: cid,
      cf_index: s.problem.index,
      verdict: s.verdict ?? "UNKNOWN",
      source: "codeforces",
      solved_at: new Date(s.creationTimeSeconds * 1000).toISOString(),
    });
    const outcome = s.verdict === "OK" ? 1 : 0;
    for (const tag of s.problem.tags) {
      const list = topicOutcomes.get(tag) ?? [];
      list.push(outcome);
      topicOutcomes.set(tag, list);
    }
  }

  if (inserts.length) {
    for (let i = 0; i < inserts.length; i += 500) {
      const { error } = await supabaseAdmin.from("submissions").insert(inserts.slice(i, i + 500));
      if (error) throw new Error(error.message);
    }
  }

  const { data: masteryRows } = await supabaseAdmin
    .from("topic_mastery")
    .select("topic, score, confidence")
    .eq("user_id", userId);
  const map = new Map<string, { score: number; confidence: number }>();
  for (const m of masteryRows ?? [])
    map.set(m.topic, { score: Number(m.score), confidence: m.confidence });

  const upserts = Array.from(topicOutcomes.entries()).map(([topic, outcomes]) => {
    const prev = map.get(topic) ?? { score: 0.5, confidence: 0 };
    let score = prev.score;
    for (const o of outcomes) score = updateMasteryScore(score, o);
    return {
      user_id: userId,
      topic,
      score,
      confidence: prev.confidence + outcomes.length,
      updated_at: new Date().toISOString(),
    };
  });

  if (upserts.length) {
    const { error } = await supabaseAdmin
      .from("topic_mastery")
      .upsert(upserts, { onConflict: "user_id,topic" });
    if (error) throw new Error(error.message);
  }

  return { synced: inserts.length };
}
