CREATE OR REPLACE FUNCTION public.mark_meal_cooked(_week date, _date text, _meal text, _pantry_ids uuid[]) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE plan_row public.meal_plans; next_slots jsonb; target jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO plan_row FROM public.meal_plans WHERE user_id = auth.uid() AND week_start = _week FOR UPDATE;
  IF plan_row.id IS NULL THEN RAISE EXCEPTION 'Plan not found'; END IF;
  SELECT value INTO target FROM jsonb_array_elements(plan_row.slots) WHERE value->>'date' = _date AND value->>'meal' = _meal;
  IF target IS NULL OR target->>'recipe_id' IS NULL THEN RAISE EXCEPTION 'Meal not found'; END IF;
  IF target->>'cooked' = 'true' THEN RETURN target; END IF;
  SELECT jsonb_agg(CASE WHEN value->>'date' = _date AND value->>'meal' = _meal THEN value || '{"cooked":true,"locked":true}'::jsonb ELSE value END ORDER BY ordinality) INTO next_slots FROM jsonb_array_elements(plan_row.slots) WITH ORDINALITY;
  UPDATE public.meal_plans SET slots = next_slots, updated_at = now() WHERE id = plan_row.id;
  DELETE FROM public.pantry_items WHERE user_id = auth.uid() AND id = ANY(_pantry_ids);
  RETURN target || '{"cooked":true,"locked":true}'::jsonb;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_meal_cooked(date, text, text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_meal_cooked(date, text, text, uuid[]) TO authenticated, service_role;