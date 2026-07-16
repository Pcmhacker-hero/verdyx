import { useEffect, useMemo, useState } from "react";

function useAuthUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setReady(true);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  return { userId, ready };
}
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  archiveSheet,
  createSheet,
  deleteSheet,
  duplicateSheet,
  getSheet,
  listSheets,
  migrateSheetsFromLocal,
  renameSheet,
  restoreSheet,
  setFavorite,
  updateSheetProgress,
  type SheetDTO,
  type SheetProblemDTO,
} from "@/lib/sheets.functions";

const SHEETS_KEY = ["custom-sheets"] as const;
const sheetKey = (id: string) => ["custom-sheet", id] as const;

const LEGACY_SHEETS_KEY = "verdiqx.custom-sheets";
const LEGACY_TRASH_KEY = "verdiqx.custom-sheets.trash";
const LEGACY_MIGRATED_FLAG = "verdiqx.custom-sheets.migrated.v1";
const legacyProgressKey = (sheetId: string) => `verdiqx.sheet-progress.${sheetId}`;

interface LegacyProblem {
  key: string;
  contestId: number | null;
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  url: string;
}
interface LegacySheet {
  id: string;
  name: string;
  minRating: number;
  maxRating: number;
  tags: string[];
  contest?: string | null;
  problemCount: number;
  createdAt: number;
  problemKeys?: string[];
  problems?: LegacyProblem[];
}

/* ============================================================
 * Auth-gated auto-migration
 * ============================================================ */

export function useSheetAutoMigration() {
  const qc = useQueryClient();
  const migrate = useServerFn(migrateSheetsFromLocal);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (typeof window === "undefined") return;
        if (window.localStorage.getItem(LEGACY_MIGRATED_FLAG)) return;
        const { data } = await supabase.auth.getUser();
        if (!data.user || cancelled) return;

        const rawSheets = window.localStorage.getItem(LEGACY_SHEETS_KEY);
        const rawTrash = window.localStorage.getItem(LEGACY_TRASH_KEY);
        const active: LegacySheet[] = rawSheets ? JSON.parse(rawSheets) : [];
        const trashed: LegacySheet[] = rawTrash ? JSON.parse(rawTrash) : [];
        const all = [...active, ...trashed].filter(
          (s) => s && s.problems && s.problems.length > 0,
        );
        if (all.length === 0) {
          window.localStorage.setItem(LEGACY_MIGRATED_FLAG, "1");
          return;
        }

        const payload = all.map((s) => {
          let progress: Record<string, { done?: boolean; note?: string; bookmarked?: boolean }> = {};
          try {
            const p = window.localStorage.getItem(legacyProgressKey(s.id));
            if (p) progress = JSON.parse(p);
          } catch {
            /* ignore */
          }
          return {
            name: s.name,
            minRating: s.minRating,
            maxRating: s.maxRating,
            tags: s.tags ?? [],
            contest: s.contest ?? null,
            problems: s.problems ?? [],
            legacyId: s.id,
            createdAt: s.createdAt,
            progress,
          };
        });

        await migrate({ data: { sheets: payload } });
        if (cancelled) return;
        window.localStorage.setItem(LEGACY_MIGRATED_FLAG, "1");
        qc.invalidateQueries({ queryKey: SHEETS_KEY });
      } catch {
        /* silent — do not block app */
      }
    }

    run();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") run();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ============================================================
 * Query hooks
 * ============================================================ */

export function useSheetsList() {
  const fetcher = useServerFn(listSheets);
  const { userId, ready } = useAuthUserId();
  return useQuery<SheetDTO[]>({
    queryKey: [...SHEETS_KEY, userId ?? "anon"],
    queryFn: () => fetcher() as Promise<SheetDTO[]>,
    enabled: ready && !!userId,
    staleTime: 30_000,
  });
}

export function useSheet(id: string | undefined) {
  const fetcher = useServerFn(getSheet);
  const { userId, ready } = useAuthUserId();
  return useQuery<SheetDTO | null>({
    queryKey: id ? [...sheetKey(id), userId ?? "anon"] : ["custom-sheet", "none"],
    queryFn: () => (id ? (fetcher({ data: { id } }) as Promise<SheetDTO | null>) : Promise.resolve(null)),
    enabled: !!id && ready && !!userId,
    staleTime: 15_000,
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useCreateSheet() {
  const qc = useQueryClient();
  const call = useServerFn(createSheet);
  return useMutation({
    mutationFn: (input: {
      name: string;
      minRating: number;
      maxRating: number;
      tags: string[];
      contest: string | null;
      problems: SheetProblemDTO[];
    }) => call({ data: input }) as Promise<SheetDTO>,
    onSuccess: (sheet) => {
      qc.invalidateQueries({ queryKey: SHEETS_KEY });
      qc.setQueryData(sheetKey(sheet.id), sheet);
    },
  });
}

export function useRenameSheet() {
  const qc = useQueryClient();
  const call = useServerFn(renameSheet);
  return useMutation({
    mutationFn: (input: { id: string; name: string }) => call({ data: input }),
    onMutate: async ({ id, name }) => {
      await qc.cancelQueries({ queryKey: SHEETS_KEY });
      const prev = qc.getQueryData<SheetDTO[]>(SHEETS_KEY);
      if (prev) {
        qc.setQueryData<SheetDTO[]>(
          SHEETS_KEY,
          prev.map((s) => (s.id === id ? { ...s, name } : s)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(SHEETS_KEY, ctx.prev);
      toast.error("Failed to rename sheet");
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: sheetKey(v.id) });
    },
  });
}

export function useSetFavorite() {
  const qc = useQueryClient();
  const call = useServerFn(setFavorite);
  return useMutation({
    mutationFn: (input: { id: string; isFavorite: boolean }) => call({ data: input }),
    onMutate: async ({ id, isFavorite }) => {
      await qc.cancelQueries({ queryKey: SHEETS_KEY });
      const prev = qc.getQueryData<SheetDTO[]>(SHEETS_KEY);
      if (prev) {
        qc.setQueryData<SheetDTO[]>(
          SHEETS_KEY,
          prev.map((s) => (s.id === id ? { ...s, isFavorite } : s)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(SHEETS_KEY, ctx.prev);
    },
  });
}

export function useArchiveSheet() {
  const qc = useQueryClient();
  const call = useServerFn(archiveSheet);
  return useMutation({
    mutationFn: (input: { id: string }) => call({ data: input }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: SHEETS_KEY });
      const prev = qc.getQueryData<SheetDTO[]>(SHEETS_KEY);
      if (prev) {
        qc.setQueryData<SheetDTO[]>(
          SHEETS_KEY,
          prev.map((s) => (s.id === id ? { ...s, archivedAt: new Date().toISOString() } : s)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(SHEETS_KEY, ctx.prev);
      toast.error("Failed to move sheet to trash");
    },
  });
}

export function useRestoreSheet() {
  const qc = useQueryClient();
  const call = useServerFn(restoreSheet);
  return useMutation({
    mutationFn: (input: { id: string }) => call({ data: input }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: SHEETS_KEY });
      const prev = qc.getQueryData<SheetDTO[]>(SHEETS_KEY);
      if (prev) {
        qc.setQueryData<SheetDTO[]>(
          SHEETS_KEY,
          prev.map((s) => (s.id === id ? { ...s, archivedAt: null } : s)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(SHEETS_KEY, ctx.prev);
      toast.error("Failed to restore sheet");
    },
  });
}

export function useDeleteSheet() {
  const qc = useQueryClient();
  const call = useServerFn(deleteSheet);
  return useMutation({
    mutationFn: (input: { id: string }) => call({ data: input }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: SHEETS_KEY });
      const prev = qc.getQueryData<SheetDTO[]>(SHEETS_KEY);
      if (prev) {
        qc.setQueryData<SheetDTO[]>(SHEETS_KEY, prev.filter((s) => s.id !== id));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(SHEETS_KEY, ctx.prev);
      toast.error("Failed to delete sheet");
    },
  });
}

export function useDuplicateSheet() {
  const qc = useQueryClient();
  const call = useServerFn(duplicateSheet);
  return useMutation({
    mutationFn: (input: { id: string }) => call({ data: input }) as Promise<SheetDTO>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHEETS_KEY });
    },
  });
}

export function useUpdateProgress(id: string | undefined) {
  const qc = useQueryClient();
  const call = useServerFn(updateSheetProgress);
  return useMutation({
    mutationFn: (progress: Record<string, { done?: boolean; note?: string; bookmarked?: boolean }>) => {
      if (!id) throw new Error("no sheet id");
      return call({ data: { id, progress } });
    },
    onMutate: async (progress) => {
      if (!id) return;
      await qc.cancelQueries({ queryKey: sheetKey(id) });
      const prev = qc.getQueryData<SheetDTO | null>(sheetKey(id));
      if (prev) qc.setQueryData<SheetDTO>(sheetKey(id), { ...prev, progress });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (id && ctx?.prev !== undefined) qc.setQueryData(sheetKey(id), ctx.prev);
    },
  });
}

/* Selectors */
export function useActiveSheets() {
  const q = useSheetsList();
  return useMemo(
    () => ({
      ...q,
      data: q.data?.filter((s) => !s.archivedAt) ?? [],
    }),
    [q],
  );
}

export function useTrashedSheets() {
  const q = useSheetsList();
  return useMemo(
    () => ({
      ...q,
      data: q.data?.filter((s) => !!s.archivedAt) ?? [],
    }),
    [q],
  );
}
