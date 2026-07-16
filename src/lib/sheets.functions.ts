import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============================================================
 * Shared types
 * ============================================================ */

export interface SheetProblemDTO {
  key: string;
  contestId: number | null;
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  url: string;
}

export interface SheetDTO {
  id: string;
  name: string;
  minRating: number;
  maxRating: number;
  tags: string[];
  contest: string | null;
  problemCount: number;
  isFavorite: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  progress: Record<string, { done?: boolean; note?: string; bookmarked?: boolean }>;
  problems?: SheetProblemDTO[];
}

/* ============================================================
 * Validators
 * ============================================================ */

const problemSchema = z.object({
  key: z.string().min(1).max(64),
  contestId: z.number().int().nullable(),
  index: z.string().min(1).max(8),
  name: z.string().min(1).max(300),
  rating: z.number().int().nullable(),
  tags: z.array(z.string().max(64)).max(64),
  url: z.string().url().max(500),
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  minRating: z.number().int().min(0).max(5000),
  maxRating: z.number().int().min(0).max(5000),
  tags: z.array(z.string().max(64)).max(64).default([]),
  contest: z.string().max(200).nullable().optional(),
  problems: z.array(problemSchema).min(1).max(5000),
  legacyId: z.string().max(120).optional(),
});

const idSchema = z.object({ id: z.string().uuid() });
const renameSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(120) });
const favSchema = z.object({ id: z.string().uuid(), isFavorite: z.boolean() });

const progressSchema = z.object({
  id: z.string().uuid(),
  progress: z.record(
    z.string().max(64),
    z.object({
      done: z.boolean().optional(),
      note: z.string().max(2000).optional(),
      bookmarked: z.boolean().optional(),
    }),
  ),
});

const migrateSchema = z.object({
  sheets: z
    .array(
      createSchema
        .omit({ problems: true })
        .extend({
          problems: z.array(problemSchema).max(5000).optional().default([]),
          createdAt: z.number().optional(),
          progress: z
            .record(
              z.string().max(64),
              z.object({
                done: z.boolean().optional(),
                note: z.string().max(2000).optional(),
                bookmarked: z.boolean().optional(),
              }),
            )
            .optional(),
        }),
    )
    .max(200),
});

/* ============================================================
 * Row -> DTO
 * ============================================================ */

interface SheetRow {
  id: string;
  name: string;
  min_rating: number;
  max_rating: number;
  tags: string[] | null;
  contest: string | null;
  problem_count: number;
  is_favorite: boolean;
  archived_at: string | null;
  progress: Record<string, { done?: boolean; note?: string; bookmarked?: boolean }> | null;
  created_at: string;
  updated_at: string;
}

interface ProblemRow {
  key: string;
  contest_id: number | null;
  problem_index: string;
  name: string;
  rating: number | null;
  tags: string[] | null;
  url: string;
  position: number;
}

function toDTO(r: SheetRow, problems?: ProblemRow[]): SheetDTO {
  return {
    id: r.id,
    name: r.name,
    minRating: r.min_rating,
    maxRating: r.max_rating,
    tags: r.tags ?? [],
    contest: r.contest,
    problemCount: r.problem_count,
    isFavorite: r.is_favorite,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    progress: r.progress ?? {},
    problems: problems
      ? problems
          .sort((a, b) => a.position - b.position)
          .map((p) => ({
            key: p.key,
            contestId: p.contest_id,
            index: p.problem_index,
            name: p.name,
            rating: p.rating,
            tags: p.tags ?? [],
            url: p.url,
          }))
      : undefined,
  };
}

/* ============================================================
 * List (all non-archived + archived flag)
 * ============================================================ */

export const listSheets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("custom_sheets")
      .select(
        "id, name, min_rating, max_rating, tags, contest, problem_count, is_favorite, archived_at, progress, created_at, updated_at",
      )
      .order("is_favorite", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as SheetRow[]).map((r) => toDTO(r));
  });

/* ============================================================
 * Get one (with problems)
 * ============================================================ */

export const getSheet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: sheet, error } = await context.supabase
      .from("custom_sheets")
      .select(
        "id, name, min_rating, max_rating, tags, contest, problem_count, is_favorite, archived_at, progress, created_at, updated_at",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sheet) return null;

    const { data: problems, error: pErr } = await context.supabase
      .from("custom_sheet_problems")
      .select("key, contest_id, problem_index, name, rating, tags, url, position")
      .eq("sheet_id", data.id)
      .order("position");
    if (pErr) throw new Error(pErr.message);

    return toDTO(sheet as SheetRow, problems as ProblemRow[]);
  });

/* ============================================================
 * Create
 * ============================================================ */

export const createSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (data.minRating > data.maxRating) throw new Error("minRating must be <= maxRating");

    const { data: inserted, error } = await context.supabase
      .from("custom_sheets")
      .insert({
        user_id: context.userId,
        name: data.name,
        min_rating: data.minRating,
        max_rating: data.maxRating,
        tags: data.tags,
        contest: data.contest ?? null,
        problem_count: data.problems.length,
        legacy_id: data.legacyId ?? null,
      })
      .select(
        "id, name, min_rating, max_rating, tags, contest, problem_count, is_favorite, archived_at, progress, created_at, updated_at",
      )
      .single();
    if (error) throw new Error(error.message);

    const rows = data.problems.map((p, i) => ({
      sheet_id: inserted.id,
      position: i,
      key: p.key,
      contest_id: p.contestId,
      problem_index: p.index,
      name: p.name,
      rating: p.rating,
      tags: p.tags,
      url: p.url,
    }));

    // batch insert (Supabase caps ~1000; chunk to be safe)
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error: pErr } = await context.supabase.from("custom_sheet_problems").insert(chunk);
      if (pErr) throw new Error(pErr.message);
    }
    return toDTO(inserted as SheetRow);
  });

/* ============================================================
 * Rename
 * ============================================================ */

export const renameSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => renameSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("custom_sheets")
      .update({ name: data.name })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * Favorite toggle
 * ============================================================ */

export const setFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => favSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("custom_sheets")
      .update({ is_favorite: data.isFavorite })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * Archive / Restore (trash workflow)
 * ============================================================ */

export const archiveSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("custom_sheets")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("custom_sheets")
      .update({ archived_at: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * Delete (hard)
 * ============================================================ */

export const deleteSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("custom_sheets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * Duplicate
 * ============================================================ */

export const duplicateSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase
      .from("custom_sheets")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !src) throw new Error(error?.message || "Sheet not found");

    const { data: srcProblems, error: pErr } = await context.supabase
      .from("custom_sheet_problems")
      .select("key, contest_id, problem_index, name, rating, tags, url, position")
      .eq("sheet_id", data.id);
    if (pErr) throw new Error(pErr.message);

    const { data: inserted, error: insErr } = await context.supabase
      .from("custom_sheets")
      .insert({
        user_id: context.userId,
        name: `${src.name} (copy)`,
        min_rating: src.min_rating,
        max_rating: src.max_rating,
        tags: src.tags,
        contest: src.contest,
        problem_count: src.problem_count,
      })
      .select(
        "id, name, min_rating, max_rating, tags, contest, problem_count, is_favorite, archived_at, progress, created_at, updated_at",
      )
      .single();
    if (insErr) throw new Error(insErr.message);

    if (srcProblems?.length) {
      const rows = (srcProblems as ProblemRow[]).map((p) => ({
        sheet_id: inserted.id,
        position: p.position,
        key: p.key,
        contest_id: p.contest_id,
        problem_index: p.problem_index,
        name: p.name,
        rating: p.rating,
        tags: p.tags ?? [],
        url: p.url,
      }));
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error: bErr } = await context.supabase.from("custom_sheet_problems").insert(chunk);
        if (bErr) throw new Error(bErr.message);
      }
    }
    return toDTO(inserted as SheetRow);
  });

/* ============================================================
 * Update progress (JSONB merge on server via full replace)
 * ============================================================ */

export const updateSheetProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => progressSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("custom_sheets")
      .update({ progress: data.progress })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * Migrate from localStorage
 * ============================================================ */

export const migrateSheetsFromLocal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => migrateSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!data.sheets.length) return { imported: 0 };
    let imported = 0;

    for (const s of data.sheets) {
      if (!s.legacyId) continue;
      // skip if already imported
      const { data: existing } = await context.supabase
        .from("custom_sheets")
        .select("id")
        .eq("user_id", context.userId)
        .eq("legacy_id", s.legacyId)
        .maybeSingle();
      if (existing) continue;

      const problems = s.problems ?? [];
      if (!problems.length) continue;

      const { data: inserted, error } = await context.supabase
        .from("custom_sheets")
        .insert({
          user_id: context.userId,
          name: s.name,
          min_rating: s.minRating,
          max_rating: s.maxRating,
          tags: s.tags,
          contest: s.contest ?? null,
          problem_count: problems.length,
          legacy_id: s.legacyId,
          progress: s.progress ?? {},
          created_at: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
        })
        .select("id")
        .single();
      if (error || !inserted) continue;

      const rows = problems.map((p, i) => ({
        sheet_id: inserted.id,
        position: i,
        key: p.key,
        contest_id: p.contestId,
        problem_index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags,
        url: p.url,
      }));
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        await context.supabase.from("custom_sheet_problems").insert(chunk);
      }
      imported++;
    }
    return { imported };
  });
