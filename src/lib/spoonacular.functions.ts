import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mapSpoonRecipe, searchParams, type RecipeDraft, type SpoonRecipe } from "./spoonacular";
import { auditRecipe, matchesDiet, matchesMeal } from "./mealmap";

const BASE = "https://api.spoonacular.com";

async function spoon(path: string, params: Record<string, string>) {
  const key = process.env["SPOONACULAR_API_KEY"];
  if (!key) throw new Error("Recipe service isn't set up yet.");
  const qs = new URLSearchParams({ ...params, apiKey: key });
  const res = await fetch(`${BASE}${path}?${qs}`);
  if (res.status === 402) throw new Error("We've hit today's recipe lookup limit. Try again tomorrow.");
  if (!res.ok) { console.error("Spoonacular", res.status, await res.text().catch(() => "")); throw new Error("Couldn't reach the recipe service. Try again in a bit."); }
  return res.json();
}

async function admin() { return (await import("@/integrations/supabase/client.server")).supabaseAdmin; }

async function cached<T>(key: string): Promise<T | null> {
  const db = await admin();
  const { data } = await db.from("external_recipes").select("recipe").eq("source_key", key).maybeSingle();
  return (data?.recipe as T | undefined) ?? null;
}
async function store(key: string, recipe: unknown, extra: { spoonacular_id?: number | null; source_url?: string | null } = {}) {
  const db = await admin();
  await db.from("external_recipes").upsert({ source_key: key, recipe: recipe as never, ...extra }, { onConflict: "source_key" });
}

export const extractRecipeFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string }) => {
    const u = new URL(String(d.url).trim());
    if (!/^https?:$/.test(u.protocol)) throw new Error("Paste a web link starting with http.");
    u.hash = "";
    return { url: u.toString() };
  })
  .handler(async ({ data }): Promise<RecipeDraft> => {
    const key = `url:${data.url}`;
    const hit = await cached<RecipeDraft>(key);
    if (hit) return hit;
    const raw = (await spoon("/recipes/extract", { url: data.url, analyze: "true" })) as SpoonRecipe;
    const draft = mapSpoonRecipe({ ...raw, sourceUrl: raw.sourceUrl || data.url });
    if (!draft.ingredients.length) throw new Error("Couldn't find a recipe on that page.");
    await store(key, draft, { spoonacular_id: raw.id ?? null, source_url: data.url });
    return draft;
  });

export type DiscoverResult = { id: number; minutes: number; recipe: RecipeDraft };

export const discoverRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { diets: string[]; meal: string | null; query: string }) => ({
    diets: (d.diets ?? []).filter((x) => typeof x === "string").slice(0, 7).sort(),
    meal: d.meal && ["breakfast", "lunch", "dinner"].includes(d.meal) ? d.meal : null,
    query: String(d.query ?? "").slice(0, 80).toLowerCase().trim(),
  }))
  .handler(async ({ data }): Promise<DiscoverResult[]> => {
    const key = `search:${data.diets.join(",")}|${data.meal ?? ""}|${data.query}`;
    const hit = await cached<DiscoverResult[]>(key);
    if (hit) return hit.map((r) => ({ ...r, recipe: auditRecipe(r.recipe) })).filter((r) => matchesDiet(r.recipe, data.diets) && (!data.meal || matchesMeal(r.recipe, data.meal)));
    const json = (await spoon("/recipes/complexSearch", searchParams(data.diets, data.meal, data.query))) as { results?: SpoonRecipe[] };
    const results: DiscoverResult[] = (json.results ?? []).map((r) => ({ id: r.id ?? 0, minutes: r.readyInMinutes ?? 0, recipe: mapSpoonRecipe(r) })).filter((r) => matchesDiet(r.recipe, data.diets) && (!data.meal || matchesMeal(r.recipe, data.meal)));
    await Promise.all(results.map((r) => store(`spoon:${r.id}`, r.recipe, { spoonacular_id: r.id, source_url: r.recipe.source_url })));
    await store(key, results);
    return results;
  });
