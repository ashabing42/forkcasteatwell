// Pure mapping from Spoonacular recipe JSON to Forkcast's recipe shape. Shared by server functions and tests.
import { guessCategory, suggestDietTags, suggestPrepTasks, toMetric, type Ingredient } from "./mealmap";

export type RecipeDraft = {
  title: string; image_url: string | null; servings: number; prep_minutes: number; cook_minutes: number;
  diet_tags: string[]; meal_types: string[]; ingredients: Ingredient[]; steps: string[];
  prep_tasks: { title: string; hours_before: number }[]; source_url: string | null;
};

type SpoonIng = { name?: string; nameClean?: string; amount?: number; unit?: string; aisle?: string; measures?: { metric?: { amount?: number; unitShort?: string } } };
export type SpoonRecipe = {
  id?: number; title?: string; image?: string; servings?: number; readyInMinutes?: number;
  preparationMinutes?: number | null; cookingMinutes?: number | null;
  vegan?: boolean; vegetarian?: boolean; glutenFree?: boolean; dishTypes?: string[];
  extendedIngredients?: SpoonIng[]; analyzedInstructions?: { steps?: { step?: string }[] }[];
  instructions?: string | null; sourceUrl?: string; spoonacularSourceUrl?: string;
  nutrition?: { nutrients?: { name: string; amount: number; unit: string }[] };
};

export function aisleToCategory(aisle: string | undefined, name: string): string {
  const a = (aisle ?? "").toLowerCase();
  if (/frozen/.test(a)) return "frozen";
  if (/produce/.test(a)) return "produce";
  if (/meat|seafood/.test(a)) return "protein";
  if (/milk|eggs|cheese|dairy/.test(a)) return "dairy";
  if (/bakery|bread/.test(a)) return "bakery";
  if (/spices|seasoning|condiment|oil|vinegar/.test(a)) return "spices";
  if (/pasta|rice|canned|baking|cereal|nut|grain|health|ethnic|dried/.test(a)) return "pantry";
  return guessCategory(name);
}

const SPOON_UNIT: Record<string, string> = { tbsp: "tbsp", tbsps: "tbsp", tsp: "tsp", tsps: "tsp", g: "g", kg: "kg", ml: "ml", l: "l", servings: "", serving: "", "": "" };

export function mapIngredient(i: SpoonIng): Ingredient {
  const name = (i.nameClean || i.name || "").trim();
  const m = i.measures?.metric;
  const rawUnit = (m?.unitShort ?? i.unit ?? "").toLowerCase().trim();
  const unit = SPOON_UNIT[rawUnit] ?? rawUnit;
  const q = m?.amount ?? i.amount ?? null;
  const metric = toMetric(name, q == null ? null : Math.round(q * 100) / 100, unit);
  return { name, quantity: metric.quantity, unit: metric.unit, category: aisleToCategory(i.aisle, name) };
}

function stripHtml(s: string) { return s.replace(/<[^>]+>/g, "\n").split(/\n+/).map((x) => x.trim()).filter(Boolean); }

export function mapSpoonRecipe(s: SpoonRecipe): RecipeDraft {
  const ingredients = (s.extendedIngredients ?? []).map(mapIngredient).filter((i) => i.name);
  let steps = (s.analyzedInstructions ?? []).flatMap((b) => (b.steps ?? []).map((x) => (x.step ?? "").trim())).filter(Boolean);
  if (!steps.length && s.instructions) steps = stripHtml(s.instructions);
  const tags = new Set<string>();
  if (s.vegan) tags.add("vegan");
  if (s.vegan || s.vegetarian) tags.add("vegetarian");
  if (s.glutenFree) tags.add("gluten-free");
  const nut = (n: string) => s.nutrition?.nutrients?.find((x) => x.name === n)?.amount;
  const protein = nut("Protein"); const sugar = nut("Sugar");
  if (protein != null && protein >= 25) tags.add("high-protein");
  if (sugar != null && sugar <= 10) tags.add("low-sugar");
  if (!s.nutrition) for (const t of suggestDietTags(ingredients)) if (t === "high-protein" || t === "low-sugar") tags.add(t);
  const dish = (s.dishTypes ?? []).map((d) => d.toLowerCase());
  const meals = new Set<string>();
  if (dish.some((d) => /breakfast|brunch|morning/.test(d))) meals.add("breakfast");
  if (dish.some((d) => /lunch|salad|soup/.test(d))) meals.add("lunch");
  if (dish.some((d) => /dinner|main/.test(d))) meals.add("dinner");
  if (!meals.size) { meals.add("lunch"); meals.add("dinner"); }
  const total = s.readyInMinutes ?? 30;
  const prep = s.preparationMinutes && s.preparationMinutes > 0 ? s.preparationMinutes : Math.min(15, total);
  const cook = s.cookingMinutes && s.cookingMinutes > 0 ? s.cookingMinutes : Math.max(0, total - prep);
  return {
    title: (s.title ?? "Untitled recipe").trim(), image_url: s.image ?? null, servings: s.servings && s.servings > 0 ? s.servings : 2,
    prep_minutes: prep, cook_minutes: cook, diet_tags: [...tags], meal_types: [...meals], ingredients, steps,
    prep_tasks: suggestPrepTasks(ingredients, steps), source_url: s.sourceUrl || s.spoonacularSourceUrl || null,
  };
}

/** Query params for complexSearch given Forkcast diets + a meal. */
export function searchParams(diets: string[], meal: string | null, query: string): Record<string, string> {
  const p: Record<string, string> = { number: "12", addRecipeInformation: "true", fillIngredients: "true", addRecipeInstructions: "true", addRecipeNutrition: "true", instructionsRequired: "true" };
  if (query.trim()) p["query"] = query.trim();
  if (diets.includes("vegan")) p["diet"] = "vegan"; else if (diets.includes("vegetarian")) p["diet"] = "vegetarian";
  if (diets.includes("gluten-free")) p["intolerances"] = "gluten";
  if (diets.includes("high-protein")) p["minProtein"] = "25";
  if (diets.includes("low-sugar")) p["maxSugar"] = "10";
  if (meal === "breakfast") p["type"] = "breakfast"; else if (meal === "lunch") p["type"] = "salad,soup,main course"; else if (meal === "dinner") p["type"] = "main course";
  return p;
}
