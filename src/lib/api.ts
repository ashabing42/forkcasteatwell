import { supabase } from "@/integrations/supabase/client";
import type { Ingredient, PrepTask, Profile, Recipe, Slot } from "./mealmap";
import { SEED_RECIPES } from "./seed-recipes";

export type ProfileRow = Profile & { id: string; onboarded: boolean; calendar_token: string };

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function fetchProfile(): Promise<ProfileRow | null> {
  const id = await uid();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: created, error: e2 } = await supabase.from("profiles").insert({ id }).select("*").single();
    if (e2) throw e2;
    return created as unknown as ProfileRow;
  }
  return data as unknown as ProfileRow;
}

export async function saveProfile(patch: Partial<ProfileRow>) {
  const id = await uid();
  const { id: _i, calendar_token: _c, ...rest } = patch;
  const { error } = await supabase.from("profiles").update(rest).eq("id", id);
  if (error) throw error;
}

function toRecipe(r: Record<string, unknown>): Recipe {
  return {
    ...(r as unknown as Recipe),
    ingredients: (r.ingredients as Ingredient[]) ?? [],
    steps: (r.steps as string[]) ?? [],
    prep_tasks: (r.prep_tasks as PrepTask[]) ?? [],
  };
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toRecipe(r as Record<string, unknown>));
}

export async function seedRecipesIfEmpty() {
  const { count, error } = await supabase.from("recipes").select("id", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return;
  const user_id = await uid();
  const { error: e2 } = await supabase.from("recipes").insert(SEED_RECIPES.map((r) => ({ ...r, user_id })) as never);
  if (e2) throw e2;
}

export type RecipeInput = Omit<Recipe, "id">;
export async function saveRecipe(id: string | null, r: RecipeInput): Promise<string> {
  const payload = { ...r } as never;
  if (id) {
    const { error } = await supabase.from("recipes").update(payload).eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await supabase.from("recipes").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}
export async function deleteRecipe(id: string) {
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}

export type PlanRow = { id: string | null; week_start: string; slots: Slot[]; checked_keys: string[] };
export async function fetchPlan(week_start: string): Promise<PlanRow> {
  const { data, error } = await supabase.from("meal_plans").select("*").eq("week_start", week_start).maybeSingle();
  if (error) throw error;
  if (!data) return { id: null, week_start, slots: [], checked_keys: [] };
  return { id: data.id, week_start, slots: (data.slots as unknown as Slot[]) ?? [], checked_keys: data.checked_keys ?? [] };
}
export async function savePlan(week_start: string, patch: { slots?: Slot[]; checked_keys?: string[] }) {
  const user_id = await uid();
  const { error } = await supabase
    .from("meal_plans")
    .upsert({ user_id, week_start, ...patch, slots: patch.slots as never, updated_at: new Date().toISOString() }, { onConflict: "user_id,week_start" });
  if (error) throw error;
}

export type CustomItem = { id: string; name: string; category: string; checked: boolean };
export async function fetchCustomItems(week_start: string): Promise<CustomItem[]> {
  const { data, error } = await supabase.from("shopping_items").select("id,name,category,checked").eq("week_start", week_start).order("created_at");
  if (error) throw error;
  return data ?? [];
}
export async function addCustomItem(week_start: string, name: string, category: string) {
  const { error } = await supabase.from("shopping_items").insert({ week_start, name, category });
  if (error) throw error;
}
export async function toggleCustomItem(id: string, checked: boolean) {
  const { error } = await supabase.from("shopping_items").update({ checked }).eq("id", id);
  if (error) throw error;
}
export async function deleteCustomItem(id: string) {
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);
  if (error) throw error;
}

export const qk = {
  profile: ["profile"] as const,
  recipes: ["recipes"] as const,
  plan: (w: string) => ["plan", w] as const,
  custom: (w: string) => ["custom", w] as const,
};
