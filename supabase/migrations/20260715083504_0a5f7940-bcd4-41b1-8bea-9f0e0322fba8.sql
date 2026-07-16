ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS public_badges text[] NOT NULL DEFAULT '{}';