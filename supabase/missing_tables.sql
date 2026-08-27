-- ============================================================
-- MISSING TABLES FOR VERDIQY (Custom Sheets, Submissions, Plans, Mentor)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/obxczzulplwvxszjfjna/sql/new
-- ============================================================

-- 1. Custom Sheets Table
CREATE TABLE IF NOT EXISTS public.custom_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_rating INT NOT NULL,
  max_rating INT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  contest TEXT,
  problem_count INT NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_sheets_user_id_idx ON public.custom_sheets(user_id, archived_at NULLS FIRST, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS custom_sheets_user_legacy_idx ON public.custom_sheets(user_id, legacy_id) WHERE legacy_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_sheets TO authenticated;
GRANT ALL ON public.custom_sheets TO service_role;

ALTER TABLE public.custom_sheets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own_sheets_select" ON public.custom_sheets FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own_sheets_insert" ON public.custom_sheets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own_sheets_update" ON public.custom_sheets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own_sheets_delete" ON public.custom_sheets FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Custom Sheet Problems (junction table)
CREATE TABLE IF NOT EXISTS public.custom_sheet_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID NOT NULL REFERENCES public.custom_sheets(id) ON DELETE CASCADE,
  position INT NOT NULL,
  key TEXT NOT NULL,
  contest_id INT,
  problem_index TEXT NOT NULL,
  name TEXT NOT NULL,
  rating INT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_sheet_problems_sheet_idx ON public.custom_sheet_problems(sheet_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_sheet_problems TO authenticated;
GRANT ALL ON public.custom_sheet_problems TO service_role;

ALTER TABLE public.custom_sheet_problems ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own_sheet_problems_select" ON public.custom_sheet_problems FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.custom_sheets s WHERE s.id = sheet_id AND s.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own_sheet_problems_insert" ON public.custom_sheet_problems FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.custom_sheets s WHERE s.id = sheet_id AND s.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own_sheet_problems_update" ON public.custom_sheet_problems FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.custom_sheets s WHERE s.id = sheet_id AND s.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own_sheet_problems_delete" ON public.custom_sheet_problems FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.custom_sheets s WHERE s.id = sheet_id AND s.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Daily Plans
CREATE TABLE IF NOT EXISTS public.daily_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  problem_ids TEXT[] NOT NULL DEFAULT '{}',
  task_count INT NOT NULL DEFAULT 0,
  xp_earned INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  ai_summary TEXT,
  coach_note TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_plans TO authenticated;
GRANT ALL ON public.daily_plans TO service_role;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own daily plans read" ON public.daily_plans FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own daily plans insert" ON public.daily_plans FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own daily plans update" ON public.daily_plans FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.daily_plans(id) ON DELETE SET NULL,
  position INT NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'focus',
  xp_reward INT NOT NULL DEFAULT 100,
  est_minutes INT,
  focus_topic TEXT,
  rationale TEXT,
  ai_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own recommendations read" ON public.recommendations FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own recommendations insert" ON public.recommendations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own recommendations update" ON public.recommendations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL,
  cf_contest_id INT,
  cf_index TEXT,
  verdict TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'manual',
  solved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own submissions read" ON public.submissions FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own submissions insert" ON public.submissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Topic Mastery
CREATE TABLE IF NOT EXISTS public.topic_mastery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_mastery TO authenticated;
GRANT ALL ON public.topic_mastery TO service_role;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own topic mastery read" ON public.topic_mastery FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own topic mastery upsert" ON public.topic_mastery FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Mentor Conversations
CREATE TABLE IF NOT EXISTS public.mentor_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mentor briefing',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mentor_conversations_messages_is_array CHECK (jsonb_typeof(messages) = 'array')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_conversations TO authenticated;
GRANT ALL ON public.mentor_conversations TO service_role;
ALTER TABLE public.mentor_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own mentor conversations read" ON public.mentor_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own mentor conversations insert" ON public.mentor_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own mentor conversations update" ON public.mentor_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own mentor conversations delete" ON public.mentor_conversations FOR DELETE TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
