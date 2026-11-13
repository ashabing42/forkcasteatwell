DROP POLICY IF EXISTS "signed in can read cache" ON public.external_recipes;
REVOKE ALL ON public.external_recipes FROM anon, authenticated;
GRANT ALL ON public.external_recipes TO service_role;