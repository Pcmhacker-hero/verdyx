CREATE TABLE public.mentor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Mentor briefing',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mentor_conversations_messages_is_array CHECK (jsonb_typeof(messages) = 'array')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_conversations TO authenticated;
GRANT ALL ON public.mentor_conversations TO service_role;

ALTER TABLE public.mentor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own mentor conversations read"
ON public.mentor_conversations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "own mentor conversations insert"
ON public.mentor_conversations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "own mentor conversations update"
ON public.mentor_conversations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "own mentor conversations delete"
ON public.mentor_conversations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER mentor_conversations_updated_at
BEFORE UPDATE ON public.mentor_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();