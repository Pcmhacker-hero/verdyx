ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS cf_rating integer,
  ADD COLUMN IF NOT EXISTS cf_max_rating integer,
  ADD COLUMN IF NOT EXISTS cf_rank text,
  ADD COLUMN IF NOT EXISTS cf_title_photo text,
  ADD COLUMN IF NOT EXISTS cf_country text,
  ADD COLUMN IF NOT EXISTS cf_city text,
  ADD COLUMN IF NOT EXISTS cf_organization text,
  ADD COLUMN IF NOT EXISTS cf_first_name text,
  ADD COLUMN IF NOT EXISTS cf_last_name text,
  ADD COLUMN IF NOT EXISTS cf_registered_at timestamptz,
  ADD COLUMN IF NOT EXISTS cf_synced_at timestamptz;

-- Storage policies for public 'avatars' bucket (bucket created via tool).
DO $$ BEGIN
  CREATE POLICY "avatars public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "avatars owner insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "avatars owner update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "avatars owner delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;