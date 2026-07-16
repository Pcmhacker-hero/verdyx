
CREATE TABLE public.bug_report_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bug_report_id UUID REFERENCES public.bug_reports(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('opened','submitted','failed','cancelled')),
  page_url TEXT,
  severity TEXT CHECK (severity IN ('low','normal','high')),
  error_message TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.bug_report_events TO authenticated, anon;
GRANT SELECT ON public.bug_report_events TO authenticated;
GRANT ALL ON public.bug_report_events TO service_role;

ALTER TABLE public.bug_report_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a bug report event"
  ON public.bug_report_events FOR INSERT
  TO authenticated, anon
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins can read bug report events"
  ON public.bug_report_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_bug_report_events_created_at ON public.bug_report_events (created_at DESC);
CREATE INDEX idx_bug_report_events_type ON public.bug_report_events (event_type);
