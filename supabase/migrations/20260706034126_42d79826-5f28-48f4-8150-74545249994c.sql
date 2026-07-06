
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
