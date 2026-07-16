-- 1) profile timezone
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

-- 2) One-time cleanup: if a plan currently has >1 active recs, keep the earliest by position
--    and demote the rest back to 'pending'. Safe because these were bugs, not user intent.
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY plan_id ORDER BY position ASC, created_at ASC) AS rn
  FROM public.recommendations
  WHERE status = 'active' AND plan_id IS NOT NULL
)
UPDATE public.recommendations r
SET status = 'pending'
FROM ranked
WHERE r.id = ranked.id
  AND ranked.rn > 1;

-- 3) Partial unique index enforces "at most one active rec per plan"
CREATE UNIQUE INDEX IF NOT EXISTS recommendations_one_active_per_plan
  ON public.recommendations(plan_id)
  WHERE status = 'active' AND plan_id IS NOT NULL;

-- 4) Ordered lookup helper
CREATE INDEX IF NOT EXISTS recommendations_plan_position_status_idx
  ON public.recommendations(plan_id, position, status);
