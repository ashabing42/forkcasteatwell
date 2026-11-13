CREATE TABLE public.external_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  spoonacular_id integer,
  source_url text,
  recipe jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.external_recipes TO authenticated;
GRANT ALL ON public.external_recipes TO service_role;
ALTER TABLE public.external_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in can read cache" ON public.external_recipes FOR SELECT TO authenticated USING (true);
CREATE INDEX external_recipes_spoon_id ON public.external_recipes(spoonacular_id);