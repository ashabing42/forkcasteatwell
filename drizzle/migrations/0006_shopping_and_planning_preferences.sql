ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS start_day integer NOT NULL DEFAULT 0 CHECK (start_day BETWEEN 0 AND 6);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pantry_setup_done boolean NOT NULL DEFAULT false;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS nutrition jsonb;
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS needed_keys text[] NOT NULL DEFAULT '{}';