
ALTER TABLE public.daily_plans
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS task_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'focus',
  ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS ai_feedback text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.daily_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS recommendations_plan_position_idx
  ON public.recommendations(plan_id, position);
