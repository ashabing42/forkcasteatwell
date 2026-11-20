// Pure domain logic for MealMap: diets, planning, shopping aggregation, prep scheduling, ICS.

export const DIETS = [
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥕" },
  { id: "low-calorie", label: "Low-calorie", emoji: "" },
  { id: "low-sugar", label: "Low-sugar", emoji: "🍋" },
  { id: "high-protein", label: "High-protein", emoji: "💪" },
  { id: "gluten-free", label: "Gluten-free", emoji: "🌾" },
  { id: "balanced", label: "Balanced / No restriction", emoji: "🥗" },
] as const;
export const DIET_TAGS = DIETS.filter((d) => d.id !== "balanced");

export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export type Meal = (typeof MEALS)[number];
export const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const CATEGORIES = ["produce", "protein", "dairy", "bakery", "pantry", "spices", "frozen", "other"] as const;
export const CATEGORY_LABEL: Record<string, string> = {
  produce: "Produce",
  protein: "Meat, fish & protein",
  dairy: "Dairy & eggs",
  bakery: "Bakery",
  pantry: "Cupboard & dry goods",
  spices: "Spices & condiments",
  frozen: "Frozen",
  other: "Other",
};

export type Ingredient = { name: string; quantity: number | null; unit: string; category: string };
export type PrepTask = { title: string; hours_before: number };
export type Recipe = {
  id: string;
  title: string;
  image_url: string | null;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  diet_tags: string[];
  meal_types: string[];
  ingredients: Ingredient[];
  steps: string[];
  prep_tasks: PrepTask[];
  source_url?: string | null;
  nutrition?: Nutrition | null;
};
export type Slot = { date: string; meal: string; recipe_id: string | null; locked: boolean; cooked?: boolean };
export type Profile = {
  diets: string[];
  meals: string[];
  days: number;
  servings: number;
  breakfast_time: string;
  lunch_time: string;
  dinner_time: string;
  snack_time: string;
  timezone: string;
  start_day?: number;
};

// ---------- dates ----------
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function parseISODate(s: string): Date {
  const [y = 0, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
/** Monday of the week containing the date. */
export function weekStartOf(d: Date): string {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - dow);
  return toISODate(c);
}

// ---------- planning ----------
export function matchesDiet(recipe: Pick<Recipe, "diet_tags"> & Partial<Pick<Recipe, "ingredients">>, diets: string[]): boolean {
  const req = diets.filter((d) => d !== "balanced");
  return req.every((d) => recipe.diet_tags.includes(d)) &&
    (!req.includes("gluten-free") || !recipe.ingredients?.some((i) => containsGluten(i.name)));
}
/** Conservative ingredient audit; gluten-free alternatives must be explicit. */
export function containsGluten(name: string): boolean {
  const n = name.toLowerCase();
  if (/gluten[- ]free/.test(n)) return false;
  if (/tamari/.test(n) && !/\bor\b/.test(n)) return false;
  return /\b(flour|bread|pasta|spaghetti|noodles?|couscous|barley|wheat|wholewheat|tortillas?|wraps?|breadcrumbs?|soy sauce|buns?|pita|crackers?|rye|oats?|granola|seitan|croutons?)\b/.test(n);
}

/** Old starter photos were borrowed, not photographs of these dishes. */
const BORROWED_PHOTOS = /photo-(?:1455619452474-d2be8b1e70cd|1569718212165-3a8278d5f624|1599020792689-9fde458e7e17|1547592180-85f173990554|1517673400267-0251440c45dc|1512058564366-18510be2db19|1488477181946-6428a0291777|1515543237350-b3eea1ec8082|1529042410759-befb1204b468|1467003909585-2f8a72700288|1482049016688-2d3e1b311543|1473093295043-cdd812d0e601|1505576399279-565b52d4ac71|1511690656952-34342bb7c2f2|1540189549336-e6e99c3679fe|1504674900247-0877df9cc836|1476124369491-e7addf5db371|1516684732162-798a0062be99|1546069901-ba9599a7e63c|1525351484163-7529414344d8|1512621776951-a57141f2eefd|1543339308-43e59d6b73a6)/;
export function auditRecipe<T extends Omit<Recipe, "id">>(recipe: T): T {
  const nutrition = recipeNutrition(recipe);
  const tags = recipe.diet_tags.filter((tag) => tag !== "gluten-free" || !recipe.ingredients.some((i) => containsGluten(i.name)))
    .filter((tag) => tag !== "high-protein" || nutrition == null || nutrition.protein_g >= 25)
    .filter((tag) => tag !== "low-calorie" || (nutrition != null && nutrition.kcal <= 500));
  if (nutrition && nutrition.kcal <= 500 && !tags.includes("low-calorie")) tags.push("low-calorie");
  return { ...recipe,
    nutrition,
    ingredients: recipe.ingredients.map(normalizeIngredient),
    image_url: recipe.image_url && BORROWED_PHOTOS.test(recipe.image_url) ? null : recipe.image_url,
    diet_tags: tags,
  };
}

export type PlanningSettings = Pick<Profile, "diets" | "servings" | "days" | "meals" | "start_day">;
export function sameWeekSettings(a: PlanningSettings, b: PlanningSettings): boolean {
  const same = (x: string[], y: string[]) => [...x].sort().join("|") === [...y].sort().join("|");
  return (a.start_day ?? 0) === (b.start_day ?? 0) && a.servings === b.servings && a.days === b.days && same(a.diets, b.diets) && same(a.meals, b.meals);
}
export function planningShortages(slots: Slot[], recipes: Recipe[], diets: string[]) {
  return [...new Set(slots.map((s) => s.meal))].map((meal) => ({
    meal,
    needed: slots.filter((s) => s.meal === meal).length,
    available: recipes.filter((r) => matchesDiet(r, diets) && matchesMeal(r, meal)).length,
  })).filter((x) => x.available < x.needed);
}
export function matchesMeal(recipe: Pick<Recipe, "meal_types">, meal: string): boolean {
  return recipe.meal_types.length === 0 || recipe.meal_types.includes(meal);
}

export function buildEmptySlots(weekStart: string, profile: Pick<Profile, "days" | "meals" | "start_day">): Slot[] {
  const meals = MEALS.filter((m) => profile.meals.includes(m));
  const slots: Slot[] = [];
  for (let i = 0; i < profile.days; i++) {
    for (const meal of meals) slots.push({ date: addDays(planStartDate(weekStart, profile.start_day), i), meal, recipe_id: null, locked: false });
  }
  return slots;
}

/** Merge existing slots into the shape dictated by the profile (keeps matching date+meal). */
export function reconcileSlots(weekStart: string, profile: Pick<Profile, "days" | "meals" | "start_day">, existing: Slot[]): Slot[] {
  const map = new Map(existing.map((s) => [`${s.date}|${s.meal}`, s]));
  return buildEmptySlots(weekStart, profile).map((s) => map.get(`${s.date}|${s.meal}`) ?? s);
}

/**
 * Fill every unlocked slot with a diet- and meal-matching recipe, avoiding repeats in the week
 * where possible. Locks are kept only when the recipe still matches the active rules.
 */
export function generatePlan(slots: Slot[], recipes: Recipe[], diets: string[], rand: () => number = Math.random): Slot[] {
  const eligible = recipes.filter((r) => matchesDiet(r, diets));
  const validLock = (s: Slot) => s.locked && eligible.some((r) => r.id === s.recipe_id && matchesMeal(r, s.meal));
  const used = new Map<string, number>();
  for (const s of slots) if (validLock(s) && s.recipe_id) used.set(s.recipe_id, (used.get(s.recipe_id) ?? 0) + 1);
  return slots.map((s) => {
    if (s.cooked || validLock(s)) return s;
    const pool = eligible.filter((r) => matchesMeal(r, s.meal));
    if (pool.length === 0) return { ...s, recipe_id: null, locked: false };
    const minUse = Math.min(...pool.map((r) => used.get(r.id) ?? 0));
    const least = pool.filter((r) => (used.get(r.id) ?? 0) === minUse);
    const pick = least[Math.floor(rand() * least.length)];
    if (!pick) return { ...s, recipe_id: null, locked: false };
    used.set(pick.id, (used.get(pick.id) ?? 0) + 1);
    return { ...s, recipe_id: pick.id, locked: false };
  });
}

export function surpriseFor(slot: Slot, slots: Slot[], recipes: Recipe[], diets: string[], rand: () => number = Math.random): string | null {
  const inWeek = new Set(slots.map((s) => s.recipe_id));
  const pool = recipes.filter((r) => matchesDiet(r, diets) && matchesMeal(r, slot.meal) && r.id !== slot.recipe_id);
  const fresh = pool.filter((r) => !inWeek.has(r.id));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(rand() * from.length)]?.id ?? null;
}

// ---------- shopping ----------
export type ShoppingLine = { key: string; name: string; quantity: number | null; unit: string; category: string; recipeTitles?: string[] };

const UNIT_ALIASES: Record<string, string> = {
  tablespoon: "tbsp", tablespoons: "tbsp", tbsps: "tbsp", tbs: "tbsp",
  teaspoon: "tsp", teaspoons: "tsp", tsps: "tsp",
  cups: "cup", grams: "g", gram: "g", kilograms: "kg", kilogram: "kg",
  milliliters: "ml", millilitres: "ml", liter: "l", liters: "l", litres: "l",
  ounces: "oz", ounce: "oz", pounds: "lb", pound: "lb", lbs: "lb",
  cloves: "clove", tins: "can", tin: "can", cans: "can", bunches: "bunch", slices: "slice", sticks: "stick", pieces: "", piece: "", pcs: "", whole: "", head: "", heads: "",
};
export function normalizeUnit(u: string): string {
  const k = (u || "").trim().toLowerCase().replace(/\.$/, "");
  return UNIT_ALIASES[k] ?? k;
}
export function canonicalName(name: string): string {
  let n = name.toLowerCase().trim().replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  if (/^(?:canned |tinned |chopped |diced |crushed )?tomatoes?$/.test(n) && /canned|tinned|chopped|diced|crushed/.test(n)) return "canned tomatoes";
  if (/^(?:canned |tinned )?tuna(?: in .*)?$/.test(n)) return "canned tuna";
  if (/^(ground turkey|turkey mince|minced turkey)$/.test(n)) return "turkey mince";
  if (/^(lettuce|little gem lettuce|romaine lettuce)$/.test(n)) return "lettuce";
  if (/^(lemon|lemons|lemon juice)$/.test(n)) return "lemon";
  if (/^(courgettes?|zucchinis?)$/.test(n)) return "courgette";
  if (/^(salt (&|and) pepper)$/.test(n)) return "salt & pepper";
  if (/^(oregano|dried oregano)$/.test(n)) return "dried oregano";
  if (/^tamari/.test(n)) return "tamari (gluten-free soy sauce)";
  return n;
}
function normalizeName(name: string): string {
  let n = canonicalName(name);
  if (/^(hummus|couscous|asparagus|molasses)$/.test(n)) return n;
  n = n.replace(/tomatoes\b/g, "tomato").replace(/potatoes\b/g, "potato");
  if (n.endsWith("ies")) n = n.slice(0, -3) + "y";
  else if (n.endsWith("s") && !n.endsWith("ss")) n = n.slice(0, -1);
  return n;
}
export function normalizeIngredient(ing: Ingredient): Ingredient {
  const name = canonicalName(ing.name);
  const metric = toMetric(ing.name, ing.quantity, ing.unit);
  if (/^lemon juice$/i.test(ing.name.trim()) && metric.quantity != null) {
    const volume = metric.unit === "tbsp" ? metric.quantity * 15 : metric.unit === "tsp" ? metric.quantity * 5 : metric.unit === "ml" ? metric.quantity : null;
    if (volume != null) { metric.quantity = volume / 45; metric.unit = ""; }
  }
  // Keep a gluten-free qualifier even when a grocery synonym is standardised.
  return { ...ing, name: /gluten[- ]free/i.test(ing.name) && !/gluten[- ]free/i.test(name) ? `${name} (gluten-free)` : name, ...metric };
}
function roundQty(q: number): number {
  return Math.round(q * 100) / 100;
}

// Grams per cup for common dry/solid ingredients; liquids default to ml.
const CUP_GRAMS: [RegExp, number][] = [
  [/lentil|rice|quinoa|sugar|chickpea|bean|couscous|barley/, 190], [/oat/, 90], [/flour/, 125],
  [/spinach|lettuce|kale|rocket|arugula|greens|cabbage|basil|parsley|cilantro|herb/, 30],
  [/berr|tomato|pea|corn|edamame|cucumber|pepper|broccoli|mushroom/, 150], [/nut|walnut|almond|cashew|seed/, 120],
  [/cheese|feta|parmesan/, 110], [/yogurt|yoghurt|hummus|peanut butter|tahini/, 245], [/olive/, 135],
];
const LIQUID = /(milk|stock|broth|water|juice|oil|vinegar|sauce|syrup|cream|wine)/;
/** Convert an amount to metric: g / ml, keeping tsp/tbsp for small amounts. Never cups. */
export function toMetric(name: string, quantity: number | null, unit: string): { quantity: number | null; unit: string } {
  const u = normalizeUnit(unit);
  const n = name.toLowerCase();
  if (quantity == null) return { quantity, unit: u === "cup" ? "" : u };
  switch (u) {
    case "kg": return { quantity: quantity * 1000, unit: "g" };
    case "l": return { quantity: quantity * 1000, unit: "ml" };
    case "oz": return { quantity: Math.round(quantity * 28.35), unit: "g" };
    case "lb": return { quantity: Math.round(quantity * 453.6), unit: "g" };
    case "cup": {
      if (LIQUID.test(n)) return { quantity: quantity * 240, unit: "ml" };
      const g = CUP_GRAMS.find(([re]) => re.test(n))?.[1] ?? 150;
      return { quantity: Math.round(quantity * g), unit: "g" };
    }
    default: return { quantity, unit: u };
  }
}
// Typical weight of one piece, used to merge "5 cherry tomatoes" with "200 g cherry tomatoes".
const PIECE_GRAMS: [RegExp, number][] = [
  [/spring onion|scallion/, 15], [/cherry tomato/, 15], [/tomato/, 120], [/onion|shallot/, 150], [/potato/, 150], [/carrot/, 70],
  [/garlic/, 5], [/pepper/, 160], [/courgette|zucchini/, 200], [/cucumber/, 300], [/broccoli/, 350],
  [/lemon|lime/, 80], [/banana/, 120], [/apple/, 180], [/avocado/, 170], [/mushroom/, 20],
  [/chicken breast/, 180], [/egg/, 55],
];
const ML_PER = { tsp: 5, tbsp: 15, ml: 1 } as Record<string, number>;

export function buildShoppingList(slots: Slot[], recipes: Recipe[], servings: number): ShoppingLine[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const acc = new Map<string, ShoppingLine>();
  for (const s of slots) {
    const r = s.recipe_id ? byId.get(s.recipe_id) : undefined;
    if (!r || s.cooked) continue;
    const factor = servings / Math.max(1, r.servings || 1);
    for (const ing of r.ingredients) {
      if (!ing.name?.trim()) continue;
      const m = toMetric(ing.name, ing.quantity == null ? null : ing.quantity * factor, ing.unit);
      if (/^lemon juice$/i.test(ing.name.trim()) && m.quantity != null) {
        const volume = m.unit === "tbsp" ? m.quantity * 15 : m.unit === "tsp" ? m.quantity * 5 : m.unit === "ml" ? m.quantity : null;
        if (volume != null) { m.quantity = volume / 45; m.unit = ""; }
      }
      let unit = m.unit;
      let q = m.quantity;
      // Merge spoons and ml into one volume line.
      if (unit in ML_PER) { q = q == null ? null : q * (ML_PER[unit] ?? 1); unit = "ml"; }
      const base = normalizeName(ing.name);
      if (base === "garlic" && unit === "clove" && q != null) { q /= 10; unit = "head"; }
      const key = `${base}|${unit}`;
      const prev = acc.get(key);
      if (prev) {
        prev.recipeTitles = [...new Set([...(prev.recipeTitles ?? []), r.title])];
        prev.quantity = prev.quantity == null && q == null ? null : roundQty((prev.quantity ?? 0) + (q ?? 0));
      } else {
        acc.set(key, { key, name: canonicalName(ing.name), recipeTitles: [r.title], quantity: q == null ? null : roundQty(q), unit, category: ing.category || "other" });
      }
    }
  }
  // Same ingredient listed by count in one recipe and by weight in another: fold counts into grams.
  const lines = [...acc.values()];
  for (const l of lines) {
    if (l.unit !== "" || l.quantity == null) continue;
    const base = l.key.split("|")[0] ?? "";
    const g = acc.get(`${base}|g`);
    const per = PIECE_GRAMS.find(([re]) => re.test(base))?.[1];
    if (!g || !per) continue;
    g.quantity = roundQty((g.quantity ?? 0) + l.quantity * per);
    g.recipeTitles = [...new Set([...(g.recipeTitles ?? []), ...(l.recipeTitles ?? [])])];
    acc.delete(l.key);
  }
  // Buyable counts round only after the exact amounts have been combined.
  for (const can of [...acc.values()]) {
    if (can.unit !== "can") continue;
    const base = can.key.split("|")[0] ?? "";
    const pack = /coconut milk/.test(base) ? { unit: "ml", size: 400 } : /tuna/.test(base) ? { unit: "g", size: 120 } : /tomato|bean|chickpea/.test(base) ? { unit: "g", size: 400 } : null;
    if (!pack) continue;
    const weighed = acc.get(`${base}|${pack.unit}`);
    if (!weighed || weighed.quantity == null) continue;
    can.quantity = (can.quantity ?? 0) + weighed.quantity / pack.size;
    can.recipeTitles = [...new Set([...(can.recipeTitles ?? []), ...(weighed.recipeTitles ?? [])])];
    acc.delete(weighed.key);
  }
  for (const l of acc.values()) {
    if (l.quantity != null && ["", "can", "head", "clove", "bunch", "slice", "stick", "handful", "packet", "package"].includes(l.unit)) l.quantity = Math.ceil(l.quantity);

    if (l.unit === "ml" && l.quantity != null && l.quantity < 45) {
      if (l.quantity % 15 === 0) { l.quantity = l.quantity / 15; l.unit = "tbsp"; }
      else { l.quantity = roundQty(l.quantity / 5); l.unit = "tsp"; }
    }
  }
  return [...acc.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function formatQty(q: number | null, unit: string): string {
  if (q == null) return unit;
  if ((unit === "g" || unit === "ml") && q >= 50) q = Math.round(q / 5) * 5;
  const nice = Number.isInteger(q) ? String(q) : q < 10 ? String(Math.round(q * 4) / 4) : String(Math.round(q));
  const plural = q !== 1 && ["can", "head", "clove", "bunch", "slice", "stick", "handful", "packet"].includes(unit) ? (unit === "bunch" ? "bunches" : `${unit}s`) : unit;
  return plural ? `${nice} ${plural}` : nice;
}
export function shoppingName(line: Pick<ShoppingLine, "name" | "unit" | "quantity">): string {
  if (line.unit !== "" || line.quantity === 1 || line.quantity == null) return line.name;
  const n = line.name;
  if (n.endsWith("s") || /lettuce|broccoli|spinach|rice|garlic|hummus/.test(n)) return n;
  if (/tomato|potato$/.test(n)) return `${n}es`;
  return `${n}s`;
}

// ---------- prep scheduling ----------
export function mealTime(profile: Pick<Profile, "breakfast_time" | "lunch_time" | "dinner_time" | "snack_time">, meal: string): string {
  return (
    ({ breakfast: profile.breakfast_time, lunch: profile.lunch_time, dinner: profile.dinner_time, snack: profile.snack_time } as Record<string, string>)[meal] ?? "12:00"
  );
}

/** Convert a wall-clock date+time in an IANA timezone to a UTC Date. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y = 0, mo = 1, d = 1] = date.split("-").map(Number);
  const [h = 0, mi = 0] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  const first = guess - offset;
  const offset2 = tzOffsetMs(new Date(first), timeZone);
  return new Date(guess - offset2);
}
function tzOffsetMs(at: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(at);
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
    return asUtc - at.getTime();
  } catch {
    return 0;
  }
}

export type PrepEvent = {
  id: string;
  title: string;
  recipeTitle: string;
  recipeId: string;
  meal: string;
  mealDate: string;
  due: Date;
  mealAt: Date;
  /** "meal" events show the meal itself; default is a prep task. */
  kind?: "prep" | "meal";
  durationMin?: number;
  description?: string;
};

/** One calendar event per planned meal, at the meal's time. */
export function computeMealEvents(slots: Slot[], recipes: Recipe[], profile: Profile, servings?: number): PrepEvent[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const out: PrepEvent[] = [];
  for (const s of slots) {
    const r = s.recipe_id ? byId.get(s.recipe_id) : undefined;
    if (!r) continue;
    const mealAt = zonedToUtc(s.date, mealTime(profile, s.meal), profile.timezone || "UTC");
    const label = MEAL_LABEL[s.meal] ?? s.meal;
    const time = (Number(r.prep_minutes) || 0) + (Number(r.cook_minutes) || 0);
    out.push({
      id: `meal-${s.date}-${s.meal}`,
      title: `${label}: ${r.title}`,
      recipeTitle: r.title,
      recipeId: r.id,
      meal: s.meal,
      mealDate: s.date,
      due: mealAt,
      mealAt,
      kind: "meal",
      durationMin: 45,
      description: [`${label}: ${r.title}`, servings ? `Serves ${servings}` : "", time ? `Ready in about ${time} min` : "",
        r.ingredients.length ? `You'll need: ${r.ingredients.slice(0, 8).map((i) => i.name).join(", ")}` : ""].filter(Boolean).join("\n"),
    });
  }
  return out.sort((a, b) => a.due.getTime() - b.due.getTime());
}

/** Opens Google Calendar's "add this calendar" screen for a feed URL. */
export function googleCalendarSubscribeUrl(feedUrl: string): string {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl.replace(/^https?:/, "webcal:"))}`;
}

export function computePrepEvents(slots: Slot[], recipes: Recipe[], profile: Profile): PrepEvent[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const out: PrepEvent[] = [];
  for (const s of slots) {
    const r = s.recipe_id ? byId.get(s.recipe_id) : undefined;
    if (!r) continue;
    const mealAt = zonedToUtc(s.date, mealTime(profile, s.meal), profile.timezone || "UTC");
    r.prep_tasks.forEach((t, i) => {
      out.push({
        id: `${s.date}-${s.meal}-${r.id}-${i}`,
        title: t.title,
        recipeTitle: r.title,
        recipeId: r.id,
        meal: s.meal,
        mealDate: s.date,
        due: new Date(mealAt.getTime() - (Number(t.hours_before) || 0) * 3600_000),
        mealAt,
      });
    });
  }
  return out.sort((a, b) => a.due.getTime() - b.due.getTime());
}

// ---------- ICS ----------
export function prepDueOnDate(events: PrepEvent[], date: string, timezone: string): PrepEvent[] {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
  return events.filter((e) => {
    const parts = formatter.formatToParts(e.due);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}` === date;
  });
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
export function buildIcs(events: PrepEvent[], calName = "Forkcast"): string {
  const now = icsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Forkcast//Prep reminders//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(calName)}`, "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of events) {
    const end = new Date(e.due.getTime() + (e.durationMin ?? 15) * 60_000);
    const summary = e.kind === "meal" ? e.title : `${e.title} — ${e.recipeTitle}`;
    const desc = e.description ?? `Prep for ${MEAL_LABEL[e.meal] ?? e.meal} on ${e.mealDate}: ${e.recipeTitle}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@mealmap`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsDate(e.due)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DESCRIPTION:${icsEscape(desc)}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(e.title)}`, e.kind === "meal" ? "TRIGGER:-PT30M" : "TRIGGER:-PT0M", "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// ---------- suggestions ----------
const MEAT = /(chicken|beef|pork|lamb|turkey|steak|mince|sausage|bacon|ham|duck|meat)/;
const SEAFOOD = /(salmon|tuna|cod|fish|shrimp|prawn|scallop|tilapia|halibut|crab|anchov)/;
const DRIED_LEGUME = /(beans|chickpeas|garbanzo)/;

export function suggestPrepTasks(ingredients: Ingredient[], steps: string[]): PrepTask[] {
  const tasks: PrepTask[] = [];
  for (const ing of ingredients) {
    const n = ing.name.toLowerCase();
    if (/frozen/.test(n) && (MEAT.test(n) || SEAFOOD.test(n))) {
      const what = n.replace(/frozen/g, "").trim();
      tasks.push({ title: `Thaw ${what}`, hours_before: SEAFOOD.test(n) ? 12 : 24 });
    } else if (/dried|dry /.test(n) && DRIED_LEGUME.test(n)) {
      const what = n.replace(/dried|dry/g, "").trim();
      tasks.push({ title: `Soak ${what}`, hours_before: 12 });
    }
  }
  if (steps.some((s) => /marinat/i.test(s))) tasks.push({ title: "Marinate", hours_before: 2 });
  const seen = new Set<string>();
  return tasks.filter((t) => (seen.has(t.title) ? false : (seen.add(t.title), true)));
}

const DAIRY_EGG = /(milk|cheese|butter|cream|yogurt|yoghurt|egg|honey|ghee|parmesan|mozzarella|feta)/;
const GLUTEN = /(flour|bread|pasta|spaghetti|noodle|couscous|barley|wheat|tortilla|breadcrumb|soy sauce|bun|pita|cracker|rye)/;
const SUGARY = /(sugar|syrup|honey|jam|chocolate|candy|sweetened|agave|molasses)/;
const PROTEIN = /(chicken|beef|pork|turkey|salmon|tuna|fish|shrimp|egg|tofu|tempeh|lentil|chickpea|beans|greek yogurt|protein|seitan|cottage cheese)/;

export function suggestDietTags(ingredients: Ingredient[]): string[] {
  const names = ingredients.map((i) => i.name.toLowerCase());
  const has = (re: RegExp) => names.some((n) => re.test(n));
  const tags: string[] = [];
  const meaty = has(MEAT) || has(SEAFOOD);
  const glutenFree = names.every((n) => !containsGluten(n));
  if (!meaty) tags.push("vegetarian");
  if (!meaty && !has(DAIRY_EGG)) tags.push("vegan");
  if (!has(SUGARY)) tags.push("low-sugar");
  if (names.filter((n) => PROTEIN.test(n)).length >= 1) tags.push("high-protein");
  if (glutenFree) tags.push("gluten-free");
  return DIET_TAGS.map((d) => d.id).filter((d) => tags.includes(d));
}

export function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (/frozen/.test(n)) return "frozen";
  if (MEAT.test(n) || SEAFOOD.test(n) || /(tofu|tempeh|seitan)/.test(n)) return "protein";
  if (/(milk|cheese|butter|cream|yogurt|yoghurt|egg)/.test(n)) return "dairy";
  if (/(bread|bun|pita|tortilla|bagel|baguette)/.test(n)) return "bakery";
  if (/(salt|pepper|cumin|paprika|oregano|cinnamon|chili powder|turmeric|spice|vinegar|mustard|ketchup|soy sauce|tamari|sauce)/.test(n)) return "spices";
  if (/(onion|garlic|tomato|lettuce|spinach|kale|carrot|pepper|cucumber|lemon|lime|apple|banana|berr|avocado|potato|zucchini|mushroom|herb|basil|cilantro|parsley|ginger|broccoli|celery|asparagus|fruit|orange|greens|scallion)/.test(n)) return "produce";
  if (/(flour|rice|pasta|oil|sugar|beans|lentil|chickpea|oat|quinoa|nut|seed|stock|broth|can|honey|syrup|coconut milk|noodle)/.test(n)) return "pantry";
  return "other";
}

const UNIT_WORDS = new Set([
  "cup", "cups", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons", "g", "gram", "grams", "kg", "ml", "l",
  "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds", "clove", "cloves", "can", "cans", "pinch", "handful", "bunch",
  "slice", "slices", "piece", "pieces", "package", "packet", "stick", "sticks", "quart", "pint",
]);
const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

/** Parse a free-text ingredient line such as "2 1/2 cups rolled oats". */
export function parseIngredientLine(line: string): Ingredient {
  let s = line.replace(/\s+/g, " ").trim();
  for (const [k, v] of Object.entries(FRACTIONS)) s = s.replace(new RegExp(`(\\d)?\\s?${k}`), (_m, d) => ` ${(d ? Number(d) : 0) + v} `).trim();
  const m = s.match(/^(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)(?:\s*-\s*\d+(?:\.\d+)?)?\s*(.*)$/);
  let quantity: number | null = null;
  let rest = s;
  if (m) {
    quantity = m[1]!.split(/\s+/).reduce((acc, part) => {
      if (part.includes("/")) {
        const [a = 0, b = 0] = part.split("/").map(Number);
        return acc + (b ? a / b : 0);
      }
      return acc + Number(part.replace(",", "."));
    }, 0);
    quantity = Math.round(quantity * 100) / 100;
    rest = m[2] ?? "";
  }
  let unit = "";
  const first = rest.split(" ")[0]?.toLowerCase().replace(/[.,]$/, "");
  if (first && UNIT_WORDS.has(first)) {
    unit = normalizeUnit(first);
    rest = rest.split(" ").slice(1).join(" ");
  }
  const name = rest.replace(/^of\s+/i, "").replace(/\(.*?\)/g, "").split(",")[0]!.trim() || line.trim();
  return { name, quantity, unit, category: guessCategory(name) };
}

export function parseIsoDuration(v: unknown): number {
  if (typeof v !== "string") return 0;
  const m = v.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0);
}

// ---------- pantry ----------
export const PANTRY_CATEGORIES = ["pantry", "spices", "frozen"] as const;
export function pantryKey(name: string): string {
  return normalizeName(name.replace(/^frozen\s+/i, ""));
}
/** Split shopping lines into what to buy vs. what's already at home (matched by ingredient name). */
export function splitByPantry<T extends { name: string }>(lines: T[], pantryNames: string[]): { toBuy: T[]; atHome: T[] } {
  const have = new Set(pantryNames.map(pantryKey));
  const toBuy: T[] = [];
  const atHome: T[] = [];
  for (const l of lines) (have.has(pantryKey(l.name)) ? atHome : toBuy).push(l);
  return { toBuy, atHome };
}


// ---------- shopping decisions & plan windows ----------
export const START_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export function planStartDate(week: string, startDay = 0): string { return addDays(week, Math.max(0, Math.min(6, startDay))); }
export function shoppingSlots(slots: Slot[], today: string, wholeWeek = false): Slot[] {
  return slots.filter((s) => !s.cooked && (wholeWeek || s.date >= today));
}
export function isStaple(ingredient: Pick<Ingredient, "name" | "category">): boolean {
  const n = ingredient.name.toLowerCase();
  return ingredient.category === "spices" || /\b(oil|vinegar|salt|stock|broth|tamari|soy sauce|curry paste|tahini)\b/.test(n);
}
export function freshPantryIds(recipe: Pick<Recipe, "ingredients">, pantry: { id: string; name: string }[]): string[] {
  const used = new Set(recipe.ingredients.filter((i) => !isStaple(i) && ["produce", "protein", "dairy", "bakery", "frozen"].includes(i.category)).map((i) => pantryKey(i.name)));
  return pantry.filter((p) => used.has(pantryKey(p.name))).map((p) => p.id);
}

// Representative per-100 g/ml food values. Estimates are labelled and never fill unknown foods with zero.
export type Nutrition = { kcal: number; protein_g: number; source: "provided" | "estimated" };
const FOOD_VALUES: [RegExp, number, number][] = [
  [/olive oil|sesame oil|\boil\b/, 884, 0], [/butter/, 717, 0.9], [/peanut butter|almond butter|tahini/, 590, 20],
  [/walnut|almond|cashew|hemp seed|chia seed/, 580, 20], [/salmon/, 208, 20], [/chicken breast/, 120, 23], [/chicken thigh/, 177, 20],
  [/turkey|beef mince|ground beef|steak/, 170, 22], [/tuna/, 116, 26], [/prawn|shrimp/, 85, 20], [/egg/, 143, 13], [/tofu/, 120, 13],
  [/parmesan/, 431, 38], [/halloumi|cheddar/, 320, 23], [/feta/, 265, 14], [/mozzarella/, 250, 18], [/greek yogurt/, 73, 10],
  [/yogurt|yoghurt/, 61, 4], [/hummus/, 166, 8], [/coconut milk/, 190, 2], [/milk/, 45, 2],
  [/dried.*bean|dried.*chickpea|lentil/, 350, 24], [/bean|chickpea/, 120, 7], [/rice|quinoa|pasta|noodle|oat|flour/, 360, 11],
  [/bread|tortilla|wrap|crouton/, 260, 9], [/granola/, 450, 10], [/honey|syrup|sugar/, 300, 0],
  [/avocado/, 160, 2], [/banana/, 89, 1], [/potato/, 77, 2], [/pea|edamame/, 85, 6], [/olive/, 115, 1],
  [/stock|broth|soy sauce|tamari/, 15, 1], [/tomato|onion|carrot|pepper|courgette|zucchini|broccoli|cauliflower|bean|spinach|lettuce|cabbage|cucumber|mushroom|asparagus|celery|garlic/, 30, 2],
  [/berr|lemon|lime|apple|orange/, 45, 0.5], [/basil|parsley|coriander|ginger|dill|cumin|paprika|turmeric|cinnamon|oregano|thyme|curry|mustard/, 200, 5],
];
export function recipeNutrition(recipe: Pick<Recipe, "ingredients" | "servings"> & { nutrition?: Nutrition | null }): Nutrition | null {
  if (recipe.nutrition && Number.isFinite(recipe.nutrition.kcal) && Number.isFinite(recipe.nutrition.protein_g) && recipe.nutrition.kcal > 0 && recipe.nutrition.protein_g >= 0) return recipe.nutrition;
  if (!recipe.ingredients.length) return null;
  let kcal = 0, protein = 0;
  for (const i of recipe.ingredients) {
    if (/^salt(?: and pepper| & pepper)?$/i.test(i.name)) continue;
    if (i.quantity == null) { if (isStaple(i) || /herb|parsley|basil/.test(i.name)) continue; return null; }
    const lookupName = canonicalName(i.name);
    const values = FOOD_VALUES.find(([re]) => re.test(lookupName));
    if (!values) return null;
    const m = toMetric(i.name, i.quantity, i.unit);
    let weight = m.quantity ?? 0;
    if (m.unit === "tsp") weight *= 5;
    else if (m.unit === "tbsp") weight *= 15;
    else if (m.unit === "can") weight *= /tuna/.test(i.name) ? 120 : 400;
    else if (m.unit === "clove") weight *= 5;
    else if (m.unit === "handful") weight *= 30;
    else if (m.unit === "bunch") weight *= 30;
    else if (m.unit === "slice") weight *= 40;
    else if (m.unit === "stick") weight *= 40;
    else if (m.unit === "head") weight *= /broccoli/.test(i.name) ? 350 : 50;
    else if (m.unit === "") {
      const per = PIECE_GRAMS.find(([re]) => re.test(lookupName))?.[1] ?? (/chicken thigh/.test(i.name) ? 120 : /lettuce/.test(lookupName) ? 150 : null);
      if (!per) return null;
      weight *= per;
    } else if (!["g", "ml"].includes(m.unit)) return null;
    kcal += weight * values[1] / 100; protein += weight * values[2] / 100;
  }
  return kcal > 0 ? { kcal: Math.round(kcal / Math.max(1, recipe.servings)), protein_g: Math.round(protein / Math.max(1, recipe.servings)), source: "estimated" } : null;
}
export function nutritionSummary(slots: Slot[], recipes: Recipe[]) {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const values = slots.map((s) => { const r = s.recipe_id ? byId.get(s.recipe_id) : undefined; return r ? recipeNutrition(r) : null; });
  const known = values.filter((v): v is Nutrition => v != null);
  if (!known.length) return null;
  const days = new Set(slots.map((s) => s.date)).size;
  const kcal = known.reduce((sum, v) => sum + v.kcal, 0), protein = known.reduce((sum, v) => sum + v.protein_g, 0);
  return { mealKcal: Math.round(kcal / known.length), mealProtein: Math.round(protein / known.length), dailyKcal: Math.round(kcal / Math.max(1, days)), dailyProtein: Math.round(protein / Math.max(1, days)), known: known.length, total: slots.length, complete: known.length === slots.length };
}
