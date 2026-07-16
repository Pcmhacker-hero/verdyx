
CREATE TABLE public.custom_sheets (
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

CREATE INDEX custom_sheets_user_id_idx ON public.custom_sheets(user_id, archived_at NULLS FIRST, created_at DESC);
CREATE UNIQUE INDEX custom_sheets_user_legacy_idx ON public.custom_sheets(user_id, legacy_id) WHERE legacy_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_sheets TO authenticated;
GRANT ALL ON public.custom_sheets TO service_role;

ALTER TABLE public.custom_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_sheets_select" ON public.custom_sheets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_sheets_insert" ON public.custom_sheets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_sheets_update" ON public.custom_sheets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_sheets_delete" ON public.custom_sheets FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.custom_sheet_problems (
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

CREATE INDEX custom_sheet_problems_sheet_idx ON public.custom_sheet_problems(sheet_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_sheet_problems TO authenticated;
GRANT ALL ON public.custom_sheet_problems TO service_role;

ALTER TABLE public.custom_sheet_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_sheet_problems_select" ON public.custom_sheet_problems FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_sheets s WHERE s.id = sheet_id AND s.user_id = auth.uid()));
CREATE POLICY "own_sheet_problems_insert" ON public.custom_sheet_problems FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.custom_sheets s WHERE s.id = sheet_id AND s.user_id = auth.uid()));
CREATE POLICY "own_sheet_problems_update" ON public.custom_sheet_problems FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_sheets s WHERE s.id = sheet_id AND s.user_id = auth.uid()));
CREATE POLICY "own_sheet_problems_delete" ON public.custom_sheet_problems FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_sheets s WHERE s.id = sheet_id AND s.user_id = auth.uid()));

CREATE TRIGGER custom_sheets_updated_at
  BEFORE UPDATE ON public.custom_sheets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
