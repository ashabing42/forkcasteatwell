import { supabase } from "@/integrations/supabase/client";
import { auditRecipe, canonicalName, freshPantryIds, pantryKey, type Ingredient, type PrepTask, type Profile, type Recipe, type Slot } from "./mealmap";
import { SEED_RECIPES } from "./seed-recipes";
import { USER_RECIPES } from "./user-recipes";

export type ProfileRow = Profile & { id: string; onboarded: boolean; calendar_token: string; pantry_setup_done?: boolean };

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
  return auditRecipe({
    ...(r as unknown as Recipe),
    ingredients: (r["ingredients"] as Ingredient[]) ?? [],
    steps: (r["steps"] as string[]) ?? [],
    prep_tasks: (r["prep_tasks"] as PrepTask[]) ?? [],
  });
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  const list = (data ?? []).map((r) => toRecipe(r as Record<string, unknown>));
  // Accounts created before the owner's recipe pack existed get it once.
  const titles = new Set(list.map((r) => r.title));
  if (list.length > 0 && !USER_RECIPES.some((r) => titles.has(r.title))) {
    const user_id = await uid();
    const { error: e2 } = await supabase.from("recipes").insert(USER_RECIPES.map((r) => ({ ...r, user_id })) as never);
    if (!e2) return fetchRecipes();
  }
  return list;
}

export async function seedRecipesIfEmpty() {
  const { count, error } = await supabase.from("recipes").select("id", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return;
  const user_id = await uid();
  const { error: e2 } = await supabase.from("recipes").insert([...SEED_RECIPES, ...USER_RECIPES].map((r) => ({ ...r, user_id })) as never);
  if (e2) throw e2;
}

export type RecipeInput = Omit<Recipe, "id">;
export async function saveRecipe(id: string | null, r: RecipeInput): Promise<string> {
  const payload = auditRecipe(r) as never;
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

export type WeekSettings = { diets: string[]; servings: number; days: number; meals: string[]; start_day?: number };
export type PlanRow = { id: string | null; week_start: string; slots: Slot[]; checked_keys: string[]; needed_keys: string[]; settings: WeekSettings | null };
export async function fetchPlan(week_start: string): Promise<PlanRow> {
  const { data, error } = await supabase.from("meal_plans").select("*").eq("week_start", week_start).maybeSingle();
  if (error) throw error;
  if (!data) return { id: null, week_start, slots: [], checked_keys: [], needed_keys: [], settings: null };
  return { id: data.id, week_start, slots: (data.slots as unknown as Slot[]) ?? [], checked_keys: data.checked_keys ?? [], needed_keys: data.needed_keys ?? [], settings: (data.settings as unknown as WeekSettings | null) ?? null };
}
/** Most recent week before `week_start` that has its own settings. */
export async function fetchPreviousSettings(week_start: string): Promise<WeekSettings | null> {
  const { data, error } = await supabase.from("meal_plans").select("settings").lt("week_start", week_start).not("settings", "is", null).order("week_start", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return (data?.settings as unknown as WeekSettings | null) ?? null;
}
export async function savePlan(week_start: string, patch: { slots?: Slot[]; checked_keys?: string[]; needed_keys?: string[]; settings?: WeekSettings }) {
  const user_id = await uid();
  const { error } = await supabase
    .from("meal_plans")
    .upsert({ user_id, week_start, ...patch, slots: patch.slots as never, settings: patch.settings as never, updated_at: new Date().toISOString() }, { onConflict: "user_id,week_start" });
  if (error) throw error;
}

export type CustomItem = { id: string; name: string; category: string; checked: boolean };
export async function fetchCustomItems(week_start: string): Promise<CustomItem[]> {
  const { data, error } = await supabase.from("shopping_items").select("id,name,category,checked").eq("week_start", week_start).order("created_at");
  if (error) throw error;
  return data ?? [];
}
export async function addCustomItem(week_start: string, name: string, category: string) {
  const existing = await fetchCustomItems(week_start);
  const duplicate = existing.find((i) => pantryKey(i.name) === pantryKey(name));
  if (duplicate) { await toggleCustomItem(duplicate.id, false); return; }
  const { error } = await supabase.from("shopping_items").insert({ week_start, name: canonicalName(name), category });
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

export type PantryItem = { id: string; name: string; location: string };
export async function fetchPantry(): Promise<PantryItem[]> {
  const { data, error } = await supabase.from("pantry_items").select("id,name,location").order("name");
  if (error) throw error;
  return data ?? [];
}
export async function addPantryItem(name: string, location: string) {
  const existing = (await fetchPantry()).find((i) => pantryKey(i.name) === pantryKey(name));
  if (existing) return { id: existing.id, created: false };
  const { data, error } = await supabase.from("pantry_items").insert({ name: canonicalName(name), location }).select("id").single();
  if (error) throw error;
  return { id: data.id, created: true };
}
export async function deletePantryItem(id: string) {
  const { error } = await supabase.from("pantry_items").delete().eq("id", id);
  if (error) throw error;
}
export async function markMealCooked(week: string, slot: Slot, recipe: Recipe) {
  const pantry = await fetchPantry();
  const { error } = await supabase.rpc("mark_meal_cooked", { _week: week, _date: slot.date, _meal: slot.meal, _pantry_ids: freshPantryIds(recipe, pantry) });
  if (error) throw error;
}

export const qk = {
  pantry: ["pantry"] as const,
  profile: ["profile"] as const,
  recipes: ["recipes"] as const,
  plan: (w: string) => ["plan", w] as const,
  prevSettings: (w: string) => ["prevSettings", w] as const,
  custom: (w: string) => ["custom", w] as const,
};
